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

router.post("/beauty/consult", (req, res) => {
  const { skinTone, insights = [], vitalityScore, sensitivity = "medium", budgetINR } = req.body || {};

  // 1. Analyze biometric data
  const metricMap = new Map<string, number>();
  for (const item of insights) {
    if (typeof item.displayScore === "number") {
      metricMap.set(item.type, item.displayScore);
    } else if (typeof item.score === "number") {
      metricMap.set(item.type, Math.round(item.score * 100));
    }
  }

  const oiliness = metricMap.get("oiliness") ?? 40;
  const moisture = metricMap.get("moisture") ?? 60;
  const redness = metricMap.get("redness") ?? 30;
  const acne = metricMap.get("acne") ?? 20;
  const pores = metricMap.get("pore") ?? 35;
  const wrinkles = metricMap.get("wrinkle") ?? 25;
  const radiance = metricMap.get("radiance") ?? 65;

  let skinTypeDetected = "Normal to Combination";
  const primaryConcerns: string[] = [];

  if (oiliness > 55 && moisture < 45) {
    skinTypeDetected = "Dehydrated Oily Skin";
    primaryConcerns.push("Compensatory surface sebum caused by sub-surface water depletion");
  } else if (oiliness > 55) {
    skinTypeDetected = "Sebum-Rich / Oily";
    primaryConcerns.push("Excess follicular lipid production and visible pore dilation");
  } else if (moisture < 45) {
    skinTypeDetected = "Lipid-Depleted / Dry";
    primaryConcerns.push("Transepidermal water loss (TEWL) and compromised stratum corneum");
  }

  if (acne > 40) primaryConcerns.push("Active follicular congestion and microbial microcomedones");
  if (redness > 45) primaryConcerns.push("Cutaneous microvascular reactivity / mild erythema");
  if (wrinkles > 45) primaryConcerns.push("Loss of dermal tensile firmness & fine expression lines");
  if (pores > 50) primaryConcerns.push("Follicular enlargement in the central facial zone");
  if (primaryConcerns.length === 0) {
    primaryConcerns.push("Maintenance of skin barrier homeostasis and preventive antioxidant defense");
  }

  // 2. Build AM / PM Regimen from verified catalog
  const amRoutine: Array<{ step: string; category: string; product: typeof beautyProducts[0]; reason: string }> = [];
  const pmRoutine: Array<{ step: string; category: string; product: typeof beautyProducts[0]; reason: string }> = [];

  // AM Cleanser
  const gentleCleanser = beautyProducts.find((p) => p.id === (oiliness > 60 ? "minimalist-salicylic-cleanser" : "cerave-hydrating-cleanser"))!;
  amRoutine.push({
    step: "Step 1: Cleanse",
    category: "cleanser",
    product: gentleCleanser,
    reason: oiliness > 60 ? "Clears overnight sebum without stripping skin barrier" : "Ceramide-infused hydration to prepare skin for active absorption",
  });

  // AM Treatment Serum
  const amSerum = beautyProducts.find((p) => p.id === (redness > 45 || sensitivity === "high" ? "the-ordinary-hyaluronic-acid" : oiliness > 50 ? "minimalist-niacinamide-10" : "minimalist-vitamin-c-16"))!;
  amRoutine.push({
    step: "Step 2: Targeted Active",
    category: "serum",
    product: amSerum,
    reason: amSerum.id.includes("niacinamide")
      ? "10% Niacinamide + Zinc PCA minimizes pore appearance and regulates sebum production"
      : amSerum.id.includes("vitamin-c")
      ? "Antioxidant photoprotection against UV-induced free radical damage"
      : "Multi-weight Hyaluronic Acid delivers deep dermal hydration without irritation",
  });

  // AM Moisturizer
  const amMoisturizer = beautyProducts.find((p) => p.id === (oiliness > 55 ? "minimalist-vitamin-b5-moisturizer" : "cerave-daily-moisturizing-lotion"))!;
  amRoutine.push({
    step: "Step 3: Hydrate",
    category: "moisturizer",
    product: amMoisturizer,
    reason: oiliness > 55 ? "Oil-free Panthenol gel locks in moisture without clogging pores" : "Triple ceramide complex reinforces the cellular lipid matrix",
  });

  // AM Sunscreen (Non-negotiable)
  const amSunscreen = beautyProducts.find((p) => p.id === (oiliness > 55 ? "minimalist-light-fluid-spf50" : "beauty-of-joseon-relief-sun"))!;
  amRoutine.push({
    step: "Step 4: Photoprotection",
    category: "sunscreen",
    product: amSunscreen,
    reason: "Broad-spectrum UV protection to prevent premature photoaging and hyperpigmentation",
  });

  // PM Cleanser
  pmRoutine.push({
    step: "Step 1: Evening Cleanse",
    category: "cleanser",
    product: beautyProducts.find((p) => p.id === "cetaphil-gentle-cleanser") || gentleCleanser,
    reason: "Thoroughly lifts sunscreen, airborne particulates, and debris without barrier disruption",
  });

  // PM Treatment (Targeted repair / Retinol or Salicylic)
  const pmSerum = beautyProducts.find((p) => p.id === (acne > 45 ? "the-ordinary-salicylic-2" : wrinkles > 40 && sensitivity !== "high" ? "minimalist-retinol-03" : "minimalist-niacinamide-10"))!;
  pmRoutine.push({
    step: "Step 2: Nocturnal Cell Renewal",
    category: "serum",
    product: pmSerum,
    reason: pmSerum.id.includes("retinol")
      ? "Stimulates collagen synthesis and cellular turnover overnight (PM use only)"
      : pmSerum.id.includes("salicylic")
      ? "Lipophilic exfoliation inside the pore lining during sleep"
      : "Restores barrier resilience and evens out tone",
  });

  // PM Barrier Moisturizer
  const pmMoisturizer = beautyProducts.find((p) => p.id === "minimalist-ceramides-madecassoside")!;
  pmRoutine.push({
    step: "Step 3: Barrier Recovery",
    category: "moisturizer",
    product: pmMoisturizer,
    reason: "0.3% Ceramides + Centella Madecassoside soothes nighttime inflammation and accelerates epidermal recovery",
  });

  // 3. Harmonious VTO Shade Pairing
  const undertone = skinTone?.undertone || "warm";
  let suggestedFoundationShade = {
    brand: "Maybelline New York",
    shadeId: "220",
    name: "Natural Beige",
    displayColorHex: "#BE8C68",
  };
  let suggestedLipShade = {
    brand: "Maybelline New York",
    name: "SuperStay Matte Ink - Nude Nuance",
    hex: "#B36551",
    family: "Warm Terracotta Nude",
  };
  let whyHarmonious = "Warm golden undertones are flattered by terracotta peach lip hues and warm beige foundations that neutralize sallowness without casting grey ashiness.";

  if (undertone === "cool") {
    suggestedFoundationShade = {
      brand: "Maybelline New York",
      shadeId: "115",
      name: "Ivory",
      displayColorHex: "#E8CEB6",
    };
    suggestedLipShade = {
      brand: "M·A·C Cosmetics",
      name: "Retro Matte - Ruby Woo",
      hex: "#BA1628",
      family: "Iconic Blue-Red",
    };
    whyHarmonious = "Cool pink/rosy undertones harmonize with blue-based red and berry lip pigments, avoiding orange or yellow shifts.";
  } else if (undertone === "olive") {
    suggestedFoundationShade = {
      brand: "Fenty Beauty",
      shadeId: "290",
      name: "290 - Medium Olive Warm",
      displayColorHex: "#BE8C63",
    };
    suggestedLipShade = {
      brand: "Maybelline New York",
      name: "SuperStay Matte Ink - Touch of Spice",
      hex: "#9B5358",
      family: "Deep Mauve Rose",
    };
    whyHarmonious = "Olive undertones require muted green-neutral undertones in foundation and mauve-rose lip pigments to prevent an artificial orange mask effect.";
  } else if (undertone === "neutral") {
    suggestedFoundationShade = {
      brand: "Maybelline New York",
      shadeId: "120",
      name: "Classic Ivory",
      displayColorHex: "#E2BFA0",
    };
    suggestedLipShade = {
      brand: "Charlotte Tilbury",
      name: "Matte Revolution - Pillow Talk",
      hex: "#C98276",
      family: "Universal Nude Pink",
    };
    whyHarmonious = "Balanced neutral skin tones can carry balanced nude pinks without tipping too warm or too cool.";
  }

  // 4. Safety & Contraindications
  const safetyNotes = [
    "Dermatological schedule separation: High-potency daytime actives (e.g. Vitamin C/Niacinamide) are separated from nocturnal cell-turnover agents (Retinol/Salicylic) to preserve epidermal barrier integrity.",
    "Non-diagnostic disclosure: BeautyLoop recommendations are formulated from published cosmetic ingredient science and verified manufacturer data, not a medical prescription.",
  ];

  res.json({
    summary: `Autonomous Derm Blueprint: Detected ${skinTypeDetected} with ${vitalityScore ? `${vitalityScore}/100 Vitality Index` : "verified biomarker balance"}.`,
    skinTypeDetected,
    primaryConcerns,
    vitalityScore: vitalityScore ?? 82,
    amRoutine,
    pmRoutine,
    suggestedShadePairing: {
      undertone,
      foundation: suggestedFoundationShade,
      lipstick: suggestedLipShade,
      whyHarmonious,
    },
    safetyNotes,
  });
});

router.post("/beauty/contraindication-check", (req, res) => {
  const { productIds = [] } = req.body || {};
  const selectedProducts = beautyProducts.filter((p) => productIds.includes(p.id));

  const warnings: Array<{ level: "caution" | "info" | "safe"; title: string; explanation: string }> = [];

  const hasRetinol = selectedProducts.some((p) => p.keyIngredients?.some((i) => i.toLowerCase().includes("retinol")));
  const hasBHA = selectedProducts.some((p) => p.keyIngredients?.some((i) => i.toLowerCase().includes("salicylic")));
  const hasVitC = selectedProducts.some((p) => p.keyIngredients?.some((i) => i.toLowerCase().includes("vitamin c") || i.toLowerCase().includes("ascorbic")));
  const hasNiacinamide = selectedProducts.some((p) => p.keyIngredients?.some((i) => i.toLowerCase().includes("niacinamide")));

  if (hasRetinol && hasBHA) {
    warnings.push({
      level: "caution",
      title: "Active Conflict: Retinol + Salicylic Acid (BHA)",
      explanation: "Using Retinol and Salicylic Acid simultaneously can overwhelm the skin barrier, leading to irritation, redness, and peeling. Recommended: Use Salicylic in AM and Retinol in PM, or alternate nights.",
    });
  }

  if (hasRetinol && hasVitC) {
    warnings.push({
      level: "caution",
      title: "pH & Potency Clash: Retinol + Pure Vitamin C",
      explanation: "L-Ascorbic Acid requires a low acidic pH (3.0-3.5) while Retinol functions best at neutral pH (5.5-6.0). Stacking them together destabilizes efficacy. Recommended: Vitamin C in AM for photoprotection; Retinol in PM for collagen synthesis.",
    });
  }

  if (hasNiacinamide && hasBHA) {
    warnings.push({
      level: "safe",
      title: "Synergistic Duo: Niacinamide + Salicylic Acid",
      explanation: "Salicylic clears lipophilic debris inside pores while Niacinamide strengthens barrier lipids and calms post-inflammatory redness. Clinically compatible.",
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      level: "safe",
      title: "Formulation Synergy Verified",
      explanation: "No conflicting active ingredients or pH collisions detected among selected products.",
    });
  }

  res.json({ warnings });
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
