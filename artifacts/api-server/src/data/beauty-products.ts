import type { BeautyFoundationProduct, BeautyProduct } from "@workspace/api-zod";

export const beautyFoundations: BeautyFoundationProduct[] = [
  {
    id: "maybelline-fit-me-matte-poreless",
    brand: "Maybelline New York",
    name: "Fit Me Matte + Poreless Foundation",
    size: "30 ml",
    priceINR: 356,
    listPriceINR: 649,
    priceNote:
      "Tira price observed for shade 220 Natural Beige; offers and prices can vary by shade and date.",
    priceObservedAt: new Date("2026-10-28T00:00:00.000Z"),
    sourceName: "Maybelline India",
    sourceUrl:
      "https://www.maybelline.co.in/all-products/face/foundation/fit-me-foundation",
    retailerSourceName: "Tira Beauty",
    retailerSourceUrl:
      "https://www.tirabeauty.com/product/maybelline-new-york-fit-me-matte--poreless-liquid-foundation---220-natural-beige-30ml-qg7luwe2yx",
    shades: [
      { id: "230", name: "Natural Buff", displayColorHex: "#C58F6B" },
      { id: "115", name: "Ivory", displayColorHex: "#E8CEB6" },
      { id: "310", name: "Sun Beige", displayColorHex: "#AE7654" },
      { id: "330", name: "Toffee", displayColorHex: "#966248" },
      { id: "120", name: "Classic Ivory", displayColorHex: "#E2BFA0" },
      { id: "228", name: "Soft Tan", displayColorHex: "#B8805D" },
      { id: "118", name: "Light Beige", displayColorHex: "#E5C4A6" },
      { id: "340", name: "Cappuccino", displayColorHex: "#734B39" },
      { id: "128", name: "Warm Nude", displayColorHex: "#D0A27B" },
      { id: "125", name: "Nude Beige", displayColorHex: "#DBB38E" },
      { id: "220", name: "Natural Beige", displayColorHex: "#BE8C68" },
      { id: "332", name: "Golden Caramel", displayColorHex: "#8D5A40" },
      { id: "123", name: "Soft Nude", displayColorHex: "#DEC09F" },
      { id: "126", name: "Light Pecan", displayColorHex: "#D5A783" },
      { id: "137", name: "Golden Tan", displayColorHex: "#BF8D67" },
      { id: "312", name: "Golden", displayColorHex: "#A9714D" },
      { id: "326", name: "Warm Tan", displayColorHex: "#9F6849" },
      { id: "127", name: "Golden Honey", displayColorHex: "#CEA078" },
    ],
  },
  {
    id: "maybelline-fit-me-tube",
    brand: "Maybelline New York",
    name: "Fit Me Matte + Poreless Tube Foundation",
    size: "18 ml",
    priceINR: 259,
    listPriceINR: 329,
    priceNote:
      "Tira price observed for shade 115 Ivory; offers and prices can vary by shade and date.",
    priceObservedAt: new Date("2026-10-28T00:00:00.000Z"),
    sourceName: "Maybelline India",
    sourceUrl:
      "https://www.maybelline.co.in/all-products/face/foundation/fit-me-tube-foundation",
    retailerSourceName: "Tira Beauty",
    retailerSourceUrl:
      "https://www.tirabeauty.com/product/maybelline-new-york-fit-me-matte--poreless-liquid-foundation-tube-spf-22---115-ivory-18ml-qc_xl-jafeq",
    shades: [
      { id: "230", name: "Natural Buff", displayColorHex: "#C58F6B" },
      { id: "128", name: "Warm Nude", displayColorHex: "#D0A27B" },
      { id: "220", name: "Natural Beige", displayColorHex: "#BE8C68" },
      { id: "310", name: "Sun Beige", displayColorHex: "#AE7654" },
      { id: "330", name: "Toffee", displayColorHex: "#966248" },
      { id: "115", name: "Ivory", displayColorHex: "#E8CEB6" },
    ],
  },
];

export const beautyProducts: BeautyProduct[] = [
  {
    id: "minimalist-niacinamide-10",
    brand: "Minimalist",
    name: "Niacinamide 10% Face Serum",
    category: "serum",
    priceINR: 539,
    keyIngredients: ["Niacinamide 10%", "Matmarine"],
    verifiedAttributes: [
      "fragrance-free",
      "non-comedogenic",
      "essential oil free",
    ],
    unknownAttributes: ["individual skin compatibility"],
    productUrl:
      "https://beminimalist.co/products/niacinamide-10-with-matmarine",
    sourceName: "Minimalist official product page",
    sourceUrl:
      "https://beminimalist.co/products/niacinamide-10-with-matmarine",
    priceObservedAt: new Date("2026-10-17T00:00:00.000Z"),
  },
  {
    id: "minimalist-ceramides-madecassoside",
    brand: "Minimalist",
    name: "Ceramides 0.3% + Madecassoside Moisturizer",
    category: "moisturizer",
    priceINR: 539,
    keyIngredients: ["Ceramides 0.3%", "Madecassoside"],
    verifiedAttributes: [
      "fragrance-free",
      "non-comedogenic",
      "essential oil free",
    ],
    unknownAttributes: ["individual skin compatibility"],
    productUrl:
      "https://beminimalist.co/products/ceramides-0-3-madecassoside",
    sourceName: "Minimalist official product page",
    sourceUrl:
      "https://beminimalist.co/products/ceramides-0-3-madecassoside",
    priceObservedAt: new Date("2026-10-17T00:00:00.000Z"),
  },
  {
    id: "minimalist-vitamin-b5-moisturizer",
    brand: "Minimalist",
    name: "Vitamin B5 10% Moisturizer",
    category: "moisturizer",
    priceINR: 314,
    keyIngredients: ["Vitamin B5 (Panthenol) 10%"],
    verifiedAttributes: [
      "fragrance-free",
      "non-comedogenic",
      "essential oil free",
      "oil-free",
    ],
    unknownAttributes: ["individual skin compatibility"],
    productUrl: "https://beminimalist.co/products/vitamin-b5-10-moisturizer",
    sourceName: "Minimalist official product page",
    sourceUrl: "https://beminimalist.co/products/vitamin-b5-10-moisturizer",
    priceObservedAt: new Date("2026-10-17T00:00:00.000Z"),
  },
];
