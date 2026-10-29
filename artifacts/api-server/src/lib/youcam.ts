import { randomUUID } from "node:crypto";
import { CreateBeautyTaskBody } from "@workspace/api-zod";

type BeautyTaskInput = ReturnType<typeof CreateBeautyTaskBody.parse>;
type BeautyTaskFeature = BeautyTaskInput["feature"];
type BeautyTaskStatus = "running" | "success" | "error";

export interface BeautyTaskOutput {
  jobId: string;
  feature: BeautyTaskFeature;
  status: BeautyTaskStatus;
  skinColor: string | null;
  skinColorName: string | null;
  insights: Array<{
    type: string;
    region: string | null;
    score: number | null;
    displayScore: number | null;
  }>;
  previewUrl: string | null;
  errorMessage: string | null;
}

interface YouCamJob {
  id: string;
  feature: BeautyTaskFeature;
  providerTaskId: string;
  createdAt: number;
  terminalResult?: BeautyTaskOutput;
}

interface ApiEnvelope extends Record<string, unknown> {
  status?: number;
  error?: string;
  error_code?: string;
  data?: unknown;
}

export class YouCamServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "YouCamServiceError";
  }
}

const apiBaseUrl = "https://yce-api-01.makeupar.com";
const jobRetentionMs = 24 * 60 * 60 * 1000;
const jobs = new Map<string, YouCamJob>();

function getApiKey(): string {
  const key = process.env.YOUCAM_API_KEY?.trim();
  if (!key) {
    throw new YouCamServiceError(
      "YouCam is not configured. Add YOUCAM_API_KEY in Replit Secrets.",
      503,
      "not_configured",
    );
  }
  return key;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getString(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function parseResponse(response: Response): Promise<ApiEnvelope> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new YouCamServiceError(
      "YouCam returned an unreadable response. Please try again.",
      502,
      "invalid_response",
    );
  }
  const envelope = asRecord(body) as ApiEnvelope | null;
  if (!envelope) {
    throw new YouCamServiceError(
      "YouCam returned an unexpected response. Please try again.",
      502,
      "invalid_response",
    );
  }
  if (!response.ok || (typeof envelope.status === "number" && envelope.status >= 400)) {
    const code = getString(envelope, "error_code") ?? "provider_error";
    const message = getString(envelope, "error");
    throw new YouCamServiceError(
      code === "CreditInsufficiency"
        ? "The YouCam account does not have enough units for this feature."
        : message ?? "YouCam could not process this request. Check feature access and try again.",
      code === "CreditInsufficiency" ? 402 : 502,
      code,
    );
  }
  return envelope;
}

async function youcamRequest(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<ApiEnvelope> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  });
  return parseResponse(response);
}

function decodeImage(imageBase64: string): Buffer {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64) || imageBase64.length % 4 !== 0) {
    throw new YouCamServiceError("The selected image could not be read. Choose it again.", 400, "invalid_image");
  }
  const image = Buffer.from(imageBase64, "base64");
  if (image.length < 4 || image.length > 8 * 1024 * 1024) {
    throw new YouCamServiceError("The image must be smaller than 8 MB.", 400, "image_size");
  }
  if (image.toString("base64").replace(/=+$/, "") !== imageBase64.replace(/=+$/, "")) {
    throw new YouCamServiceError("The selected image could not be read. Choose it again.", 400, "invalid_image");
  }
  return image;
}

async function uploadImage(
  image: Buffer,
  mimeType: BeautyTaskInput["mimeType"],
): Promise<string> {
  const extension = mimeType === "image/png" ? "png" : "jpg";
  const fileName = `beautyloop-selfie-${randomUUID()}.${extension}`;
  const fileEnvelope = await youcamRequest(
    "/s2s/v2.0/file",
    "POST",
    {
      files: [
        {
          content_type: mimeType,
          file_name: fileName,
          file_size: image.byteLength,
        },
      ],
    },
  );
  const files = asRecord(fileEnvelope.data)?.files;
  const file = Array.isArray(files) ? asRecord(files[0]) : null;
  const fileId = getString(file, "file_id");
  const requests = Array.isArray(file?.requests) ? file.requests : [];
  const uploadRequest = asRecord(requests[0]);
  const uploadUrl = getString(uploadRequest, "url");
  const method = getString(uploadRequest, "method")?.toUpperCase();
  const headers = asRecord(uploadRequest?.headers);

  if (!fileId || !uploadUrl || method !== "PUT" || !headers) {
    throw new YouCamServiceError(
      "YouCam did not provide the required image upload details.",
      502,
      "invalid_upload_response",
    );
  }

  let parsedUploadUrl: URL;
  try {
    parsedUploadUrl = new URL(uploadUrl);
  } catch {
    throw new YouCamServiceError("YouCam returned an invalid upload destination.", 502, "invalid_upload_url");
  }
  if (parsedUploadUrl.protocol !== "https:") {
    throw new YouCamServiceError("YouCam returned an insecure upload destination.", 502, "invalid_upload_url");
  }

  const uploadHeaders = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (typeof value === "string" && ["content-type", "content-length"].includes(name.toLowerCase())) {
      uploadHeaders.set(name, value);
    }
  }
  if (!uploadHeaders.has("content-type")) {
    uploadHeaders.set("content-type", mimeType);
  }
  if (!uploadHeaders.has("content-length")) {
    uploadHeaders.set("content-length", String(image.byteLength));
  }

  const uploadResponse = await fetch(parsedUploadUrl, {
    method,
    headers: uploadHeaders,
    body: image,
    signal: AbortSignal.timeout(45_000),
  });
  if (!uploadResponse.ok) {
    throw new YouCamServiceError(
      "The photo upload to YouCam failed. Please try again.",
      502,
      "image_upload_failed",
    );
  }

  return fileId;
}

function taskRequest(input: BeautyTaskInput, fileId: string): { path: string; body: unknown } {
  if (input.feature === "skin-tone") {
    return {
      path: "/s2s/v2.0/task/skin-tone-analysis",
      body: { src_file_id: fileId, face_angle_strictness_level: "high" },
    };
  }
  if (input.feature === "skin-analysis") {
    return {
      path: "/s2s/v2.0/task/skin-analysis",
      body: {
        src_file_id: fileId,
        dst_actions: ["pore", "texture", "acne", "wrinkle"],
        format: "json",
      },
    };
  }
  if (!input.foundationColor) {
    throw new YouCamServiceError(
      "Choose a foundation tone before starting the virtual try-on.",
      400,
      "foundation_color_required",
    );
  }
  return {
    path: "/s2s/v2.0/task/makeup-vto",
    body: {
      src_file_id: fileId,
      effects: [
        {
          category: "foundation",
          palettes: [
            {
              color: input.foundationColor,
              colorIntensity: input.colorIntensity,
              coverageIntensity: input.coverageIntensity,
              glowIntensity: input.glowIntensity,
            },
          ],
        },
      ],
      version: "1.0",
    },
  };
}

export async function startYouCamJob(input: BeautyTaskInput): Promise<{
  jobId: string;
  feature: BeautyTaskFeature;
}> {
  getApiKey();
  const image = decodeImage(input.imageBase64);
  if (!imageLooksLike(image, input.mimeType)) {
    throw new YouCamServiceError(
      "That file does not match its image type. Choose a JPEG or PNG photo.",
      400,
      "invalid_image_type",
    );
  }

  const fileId = await uploadImage(image, input.mimeType);
  const request = taskRequest(input, fileId);
  const taskEnvelope = await youcamRequest(request.path, "POST", request.body);
  const providerTaskId = getString(asRecord(taskEnvelope.data), "task_id");
  if (!providerTaskId) {
    throw new YouCamServiceError(
      "YouCam did not return a task ID. Please try again.",
      502,
      "invalid_task_response",
    );
  }

  const jobId = randomUUID();
  jobs.set(jobId, {
    id: jobId,
    feature: input.feature,
    providerTaskId,
    createdAt: Date.now(),
  });
  cleanupExpiredJobs();
  return { jobId, feature: input.feature };
}

function imageLooksLike(image: Buffer, mimeType: BeautyTaskInput["mimeType"]): boolean {
  if (mimeType === "image/png") {
    return image.length >= 8 && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  return image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
}

function cleanupExpiredJobs(): void {
  const now = Date.now();
  for (const [jobId, job] of jobs) {
    if (now - job.createdAt > jobRetentionMs) {
      jobs.delete(jobId);
    }
  }
}

function taskStatusPath(feature: BeautyTaskFeature, providerTaskId: string): string {
  const encodedTaskId = encodeURIComponent(providerTaskId);
  if (feature === "skin-tone") {
    return `/s2s/v2.0/task/skin-tone-analysis/${encodedTaskId}`;
  }
  if (feature === "skin-analysis") {
    return `/s2s/v2.0/task/skin-analysis/${encodedTaskId}`;
  }
  return `/s2s/v2.0/task/makeup-vto/${encodedTaskId}`;
}

function safeHttpsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeInsights(data: Record<string, unknown> | null): BeautyTaskOutput["insights"] {
  const result = asRecord(data?.results);
  const output = result?.output;
  if (!Array.isArray(output)) return [];
  return output.flatMap((entry) => {
    const insight = asRecord(entry);
    const type = getString(insight, "type");
    if (!type) return [];
    const region = getString(insight, "region");
    const rawScore = insight?.raw_score ?? insight?.score;
    const score = typeof rawScore === "number" && Number.isFinite(rawScore) ? rawScore : null;
    const rawDisplayScore = insight?.ui_score;
    const displayScore =
      typeof rawDisplayScore === "number" && Number.isInteger(rawDisplayScore)
        ? rawDisplayScore
        : null;
    return [{ type, region, score, displayScore }];
  });
}

function initialResult(job: YouCamJob): BeautyTaskOutput {
  return {
    jobId: job.id,
    feature: job.feature,
    status: "running",
    skinColor: null,
    skinColorName: null,
    insights: [],
    previewUrl: null,
    errorMessage: null,
  };
}

export async function getYouCamJob(jobId: string): Promise<BeautyTaskOutput | null> {
  cleanupExpiredJobs();
  const job = jobs.get(jobId);
  if (!job) return null;
  if (job.terminalResult) return job.terminalResult;

  const envelope = await youcamRequest(taskStatusPath(job.feature, job.providerTaskId), "GET");
  const data = asRecord(envelope.data);
  const providerStatus = getString(data, "task_status");
  if (providerStatus === "running" || providerStatus === "queued" || providerStatus === "processing") {
    return initialResult(job);
  }
  if (providerStatus === "error") {
    const message =
      getString(data, "error_message") ??
      getString(data, "error") ??
      "YouCam could not complete this task. Try a clear, front-facing image.";
    const result = { ...initialResult(job), status: "error" as const, errorMessage: message };
    job.terminalResult = result;
    return result;
  }
  if (providerStatus !== "success") {
    throw new YouCamServiceError(
      "YouCam returned an unknown task status. Please retry the task.",
      502,
      "invalid_task_status",
    );
  }

  const results = asRecord(data?.results);
  let skinColor: string | null = null;
  let skinColorName: string | null = null;
  let previewUrl: string | null = null;
  let insights: BeautyTaskOutput["insights"] = [];

  if (job.feature === "skin-tone") {
    const color = asRecord(results?.color);
    skinColor = getString(color, "skin_color");
    skinColorName = getString(color, "skin_color_name");
  } else if (job.feature === "skin-analysis") {
    insights = normalizeInsights(data);
  } else {
    const rawUrl =
      getString(results, "url") ??
      getString(results, "download_url") ??
      (Array.isArray(results) ? getString(asRecord(results[0]), "url") : null) ??
      (Array.isArray(results) ? getString(asRecord(results[0]), "download_url") : null);
    previewUrl = safeHttpsUrl(rawUrl);
  }

  const result: BeautyTaskOutput = {
    jobId: job.id,
    feature: job.feature,
    status: "success",
    skinColor,
    skinColorName,
    insights,
    previewUrl,
    errorMessage: null,
  };
  job.terminalResult = result;
  return result;
}
