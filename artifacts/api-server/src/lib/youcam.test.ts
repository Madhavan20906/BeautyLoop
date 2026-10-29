import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { CreateBeautyTaskBody } from "@workspace/api-zod";
import { getYouCamJob, startYouCamJob, YouCamServiceError } from "./youcam";

const previousApiKey = process.env.YOUCAM_API_KEY;
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (previousApiKey === undefined) delete process.env.YOUCAM_API_KEY;
  else process.env.YOUCAM_API_KEY = previousApiKey;
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("uploads consented images and normalizes all three mocked YouCam results", async () => {
  process.env.YOUCAM_API_KEY = "test-only-not-a-real-key";
  let uploadNumber = 0;
  const uploads: Array<{ headers: Headers; body: Buffer }> = [];
  const providerCalls: Array<{ path: string; method: string; body?: Record<string, unknown> }> = [];
  const expectedByTask: Record<string, { path: string; result: Record<string, unknown> }> = {
    "provider-tone": {
      path: "/s2s/v2.0/task/skin-tone-analysis",
      result: { color: { skin_color: "#D9AD8D", skin_color_name: "Warm beige" } },
    },
    "provider-skin": {
      path: "/s2s/v2.0/task/skin-analysis",
      result: {
        output: [
          { type: "pore", region: "cheek", raw_score: 0.24, ui_score: 24 },
          { type: "texture", region: "forehead", raw_score: 0.31, ui_score: 31 },
        ],
      },
    },
    "provider-vto": {
      path: "/s2s/v2.0/task/makeup-vto",
      result: { url: "https://cdn.example.test/preview.jpg" },
    },
  };

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);

    if (url.pathname === "/s2s/v2.0/file" && method === "POST") {
      providerCalls.push({ path: url.pathname, method, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
      uploadNumber += 1;
      return jsonResponse({
        data: {
          files: [
            {
              file_id: `uploaded-${uploadNumber}`,
              requests: [
                {
                  method: "PUT",
                  url: `https://upload.example.test/${uploadNumber}`,
                  headers: { "Content-Type": "image/jpeg", "Content-Length": "4" },
                },
              ],
            },
          ],
        },
      });
    }

    if (url.hostname === "upload.example.test") {
      assert.equal(headers.has("authorization"), false, "signed image upload must not receive the API bearer key");
      uploads.push({ headers, body: Buffer.from(init?.body as Uint8Array) });
      return new Response(null, { status: 200 });
    }

    assert.equal(headers.get("authorization"), "Bearer test-only-not-a-real-key");
    if (method === "POST") {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      providerCalls.push({ path: url.pathname, method, body });
      const taskId = url.pathname.endsWith("skin-tone-analysis")
        ? "provider-tone"
        : url.pathname.endsWith("skin-analysis")
          ? "provider-skin"
          : "provider-vto";
      return jsonResponse({ data: { task_id: taskId } });
    }

    const taskId = url.pathname.split("/").at(-1) ?? "";
    const fixture = expectedByTask[taskId];
    assert.ok(fixture, `unexpected provider task poll: ${url.pathname}`);
    return jsonResponse({
      data: {
        task_status: "success",
        ...(taskId === "provider-skin" ? { results: fixture.result } : { results: fixture.result }),
      },
    });
  };

  const imageBase64 = Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString("base64");
  const toneTask = await startYouCamJob(CreateBeautyTaskBody.parse({
    feature: "skin-tone",
    imageBase64,
    mimeType: "image/jpeg",
  }));
  const toneResult = await getYouCamJob(toneTask.jobId);
  assert.equal(toneResult?.status, "success");
  assert.equal(toneResult?.skinColor, "#D9AD8D");
  assert.equal(toneResult?.skinColorName, "Warm beige");

  const skinTask = await startYouCamJob(CreateBeautyTaskBody.parse({
    feature: "skin-analysis",
    imageBase64,
    mimeType: "image/jpeg",
  }));
  const skinResult = await getYouCamJob(skinTask.jobId);
  assert.deepEqual(skinResult?.insights, [
    { type: "pore", region: "cheek", score: 0.24, displayScore: 24 },
    { type: "texture", region: "forehead", score: 0.31, displayScore: 31 },
  ]);

  const vtoTask = await startYouCamJob(CreateBeautyTaskBody.parse({
    feature: "foundation-try-on",
    imageBase64,
    mimeType: "image/jpeg",
    foundationColor: "#D9AD8D",
    colorIntensity: 65,
    coverageIntensity: 60,
    glowIntensity: 35,
  }));
  const vtoResult = await getYouCamJob(vtoTask.jobId);
  assert.equal(vtoResult?.previewUrl, "https://cdn.example.test/preview.jpg");

  assert.equal(uploads.length, 3);
  assert.ok(uploads.every(({ body }) => body.equals(Buffer.from([0xff, 0xd8, 0xff, 0x00]))));
  assert.equal(providerCalls.filter((call) => call.path === "/s2s/v2.0/file").length, 3);

  const toneRequest = providerCalls.find((call) => call.path.endsWith("skin-tone-analysis") && call.method === "POST");
  assert.equal((toneRequest?.body as { face_angle_strictness_level?: string }).face_angle_strictness_level, "high");
  const skinRequest = providerCalls.find((call) => call.path.endsWith("skin-analysis") && call.method === "POST");
  assert.deepEqual((skinRequest?.body as { dst_actions?: string[] }).dst_actions, ["pore", "texture", "acne", "wrinkle"]);
  const vtoRequest = providerCalls.find((call) => call.path.endsWith("makeup-vto") && call.method === "POST");
  const effects = (vtoRequest?.body as { effects?: Array<{ palettes?: Array<Record<string, unknown>> }> }).effects;
  assert.deepEqual(effects?.[0]?.palettes?.[0], {
    color: "#D9AD8D",
    colorIntensity: 65,
    coverageIntensity: 60,
    glowIntensity: 35,
  });
});

test("rejects an image whose bytes do not match its declared type before any provider request", async () => {
  process.env.YOUCAM_API_KEY = "test-only-not-a-real-key";
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return jsonResponse({});
  };

  await assert.rejects(
    startYouCamJob(CreateBeautyTaskBody.parse({
      feature: "skin-tone",
      imageBase64: Buffer.from("not a JPEG").toString("base64"),
      mimeType: "image/jpeg",
    })),
    (error: unknown) => error instanceof YouCamServiceError && error.code === "invalid_image_type",
  );
  assert.equal(requestCount, 0);
});

test("reports a mocked insufficient-unit response without exposing provider credentials", async () => {
  process.env.YOUCAM_API_KEY = "test-only-not-a-real-key";
  let requestNumber = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname === "upload.example.test") return new Response(null, { status: 200 });
    requestNumber += 1;
    if (url.pathname === "/s2s/v2.0/file") {
      return jsonResponse({
        data: {
          files: [{
            file_id: "uploaded-credit-test",
            requests: [{
              method: "PUT",
              url: "https://upload.example.test/credit-test",
              headers: { "Content-Type": "image/jpeg", "Content-Length": "4" },
            }],
          }],
        },
      });
    }
    assert.equal(new Headers(init?.headers).has("authorization"), true);
    return jsonResponse({ error_code: "CreditInsufficiency" }, 402);
  };

  await assert.rejects(
    startYouCamJob(CreateBeautyTaskBody.parse({
      feature: "skin-tone",
      imageBase64: Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString("base64"),
      mimeType: "image/jpeg",
    })),
    (error: unknown) => error instanceof YouCamServiceError &&
      error.statusCode === 402 &&
      error.message.includes("not have enough units"),
  );
  assert.equal(requestNumber, 2);
});
