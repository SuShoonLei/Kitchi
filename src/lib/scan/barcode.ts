/** Digits-only barcode of accepted lengths. */
export function normalizeBarcode(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidBarcode(raw: string): boolean {
  const code = normalizeBarcode(raw);
  return code.length === 8 || code.length === 12 || code.length === 13;
}

export type OffProduct = {
  barcode: string;
  name: string;
  brand?: string;
  quantityText?: string;
  categories?: string;
  imageUrl?: string;
};

export type OffLookupResult =
  | { ok: true; product: OffProduct; attribution: string }
  | { ok: false; reason: "not_found" | "offline" | "invalid"; message: string };

const ATTRIBUTION = "Product data © Open Food Facts contributors";

export function mapOpenFoodFactsProduct(
  barcode: string,
  payload: unknown,
): OffLookupResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, reason: "not_found", message: "No product data returned." };
  }
  const body = payload as {
    status?: number;
    product?: {
      product_name?: string;
      product_name_en?: string;
      brands?: string;
      quantity?: string;
      categories?: string;
      image_front_small_url?: string;
    };
  };
  if (body.status === 0 || !body.product) {
    return {
      ok: false,
      reason: "not_found",
      message: "That barcode isn’t in Open Food Facts yet.",
    };
  }
  const name =
    body.product.product_name?.trim() ||
    body.product.product_name_en?.trim() ||
    body.product.brands?.trim();
  if (!name) {
    return {
      ok: false,
      reason: "not_found",
      message: "Open Food Facts has this code but no usable name.",
    };
  }
  return {
    ok: true,
    attribution: ATTRIBUTION,
    product: {
      barcode,
      name,
      brand: body.product.brands,
      quantityText: body.product.quantity,
      categories: body.product.categories,
      imageUrl: body.product.image_front_small_url,
    },
  };
}

const CACHE_KEY = "kitchi:barcode_cache";

type CacheMap = Record<string, { savedAt: number; payload: unknown }>;

function readCache(): CacheMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}") as CacheMap;
  } catch {
    return {};
  }
}

function writeCache(map: CacheMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    // Private mode / quota — lookup still succeeds without cache.
  }
}

export async function lookupBarcode(raw: string): Promise<OffLookupResult> {
  const barcode = normalizeBarcode(raw);
  if (!isValidBarcode(barcode)) {
    return { ok: false, reason: "invalid", message: "That doesn’t look like a product barcode." };
  }

  const cache = readCache();
  const hit = cache[barcode];
  if (hit) return mapOpenFoodFactsProduct(barcode, hit.payload);

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      ok: false,
      reason: "offline",
      message: "You’re offline and this code isn’t cached yet. Use Manual entry.",
    };
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          Accept: "application/json",
          // Open Food Facts asks apps to identify themselves.
          "User-Agent": "Kitchi/0.1 (https://github.com/kitchi; local-first pantry app)",
        },
      },
    );
    if (!response.ok) {
      return {
        ok: false,
        reason: "offline",
        message: "Open Food Facts didn’t respond. Try again or use Manual.",
      };
    }
    const payload: unknown = await response.json();
    cache[barcode] = { savedAt: Date.now(), payload };
    writeCache(cache);
    return mapOpenFoodFactsProduct(barcode, payload);
  } catch {
    return {
      ok: false,
      reason: "offline",
      message: "Couldn’t reach Open Food Facts. Try Manual entry with the code kept.",
    };
  }
}
