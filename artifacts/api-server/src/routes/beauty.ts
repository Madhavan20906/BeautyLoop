import { Router, type IRouter } from "express";
import {
  CompareBeautyProductsBody,
  CompareBeautyProductsResponse,
  CreateBeautyTaskBody,
  CreateBeautyTaskResponse,
  GetBeautyTaskParams,
  GetBeautyTaskResponse,
  GetBeautyFoundationsResponse,
  GetBeautyProductsResponse,
  GetBeautyStatusResponse,
} from "@workspace/api-zod";
import { beautyFoundations, beautyProducts } from "../data/beauty-products";
import { getYouCamJob, startYouCamJob, YouCamServiceError } from "../lib/youcam";

const router: IRouter = Router();

const attributeLabels = {
  fragrance_free: "fragrance-free",
  non_comedogenic: "non-comedogenic",
  essential_oil_free: "essential oil free",
  oil_free: "oil-free",
} as const;

router.get("/beauty/status", (_req, res) => {
  const configured = Boolean(process.env.YOUCAM_API_KEY?.trim());
  res.json(
    GetBeautyStatusResponse.parse({
      skinTone: configured ? "ready" : "not_configured",
      skinAnalysis: configured ? "ready" : "not_configured",
      virtualTryOn: configured ? "ready" : "not_configured",
      catalog: "partial",
    }),
  );
});

router.post("/beauty/tasks", async (req, res): Promise<void> => {
  const parsed = CreateBeautyTaskBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid BeautyLoop task request");
    res.status(400).json({ error: "Choose a valid feature and a JPEG or PNG image." });
    return;
  }

  try {
    const job = await startYouCamJob(parsed.data);
    res.status(202).json(
      CreateBeautyTaskResponse.parse({
        ...job,
        status: "running",
      }),
    );
  } catch (error) {
    if (error instanceof YouCamServiceError) {
      req.log.warn({ code: error.code, statusCode: error.statusCode }, "YouCam task could not be started");
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    req.log.error({ error }, "Unexpected error starting YouCam task");
    res.status(502).json({ error: "BeautyLoop could not start the YouCam task. Please try again." });
  }
});

router.get("/beauty/tasks/:jobId", async (req, res): Promise<void> => {
  const params = GetBeautyTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid task ID." });
    return;
  }

  try {
    const result = await getYouCamJob(params.data.jobId);
    if (!result) {
      res.status(404).json({ error: "This task has expired. Start a new request." });
      return;
    }
    res.json(GetBeautyTaskResponse.parse(result));
  } catch (error) {
    if (error instanceof YouCamServiceError) {
      req.log.warn({ code: error.code, statusCode: error.statusCode }, "Could not retrieve YouCam task");
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    req.log.error({ error }, "Unexpected error retrieving YouCam task");
    res.status(502).json({ error: "BeautyLoop could not retrieve the YouCam result. Please retry." });
  }
});

router.get("/beauty/products", (_req, res) => {
  res.json(GetBeautyProductsResponse.parse(beautyProducts));
});

router.get("/beauty/foundations", (_req, res) => {
  res.json(GetBeautyFoundationsResponse.parse(beautyFoundations));
});

router.post("/beauty/compare", (req, res) => {
  const parsed = CompareBeautyProductsBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      { errors: parsed.error.message },
      "Invalid BeautyLoop comparison request",
    );
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { maxPriceINR, category, preferredAttributes = [] } = parsed.data;
  const filteredProducts = beautyProducts.filter((product) => {
    if (maxPriceINR !== undefined && product.priceINR > maxPriceINR) {
      return false;
    }
    if (category !== undefined && product.category !== category) {
      return false;
    }
    return true;
  });

  const matches = filteredProducts
    .map((product) => {
      const matchReasons: string[] = [];
      const unconfirmedPreferences: string[] = [];

      if (maxPriceINR !== undefined) {
        matchReasons.push("At or below your selected budget");
      }
      if (category !== undefined) {
        matchReasons.push("Matches your selected product format");
      }

      for (const preference of preferredAttributes) {
        const label = attributeLabels[preference];
        if (product.verifiedAttributes.includes(label)) {
          matchReasons.push(`Manufacturer lists ${label}`);
        } else {
          unconfirmedPreferences.push(
            `${label} is not confirmed on the manufacturer source`,
          );
        }
      }

      if (matchReasons.length === 0) {
        matchReasons.push("Compared using manufacturer-listed product details");
      }

      return {
        product,
        matchReasons,
        unconfirmedPreferences,
        preferenceMatchCount: preferredAttributes.filter((preference) =>
          product.verifiedAttributes.includes(attributeLabels[preference]),
        ).length,
      };
    })
    .sort(
      (left, right) =>
        right.preferenceMatchCount - left.preferenceMatchCount ||
        left.product.priceINR - right.product.priceINR,
    )
    .map(({ product, matchReasons, unconfirmedPreferences }) => ({
      product,
      matchReasons,
      unconfirmedPreferences,
    }));

  res.json(
    CompareBeautyProductsResponse.parse({
      matches,
      noMatchReason:
        matches.length === 0
          ? "No listed product fits the selected category and budget. Try adjusting one of those filters."
          : null,
    }),
  );
});

export default router;
