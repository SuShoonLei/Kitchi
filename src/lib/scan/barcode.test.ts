import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isValidBarcode,
  lookupBarcode,
  mapOpenFoodFactsProduct,
  normalizeBarcode,
} from "@/lib/scan/barcode";
import { expiryFromShelfLife, guessCategoryFromName } from "@/lib/scan/shelf-life";

describe("barcode validation", () => {
  it("accepts EAN-13, EAN-8, UPC-A", () => {
    expect(isValidBarcode("12345670")).toBe(true);
    expect(isValidBarcode("123456789012")).toBe(true);
    expect(isValidBarcode("1234567890123")).toBe(true);
    expect(isValidBarcode("abc")).toBe(false);
    expect(normalizeBarcode("12 345-678")).toBe("12345678");
  });
});

describe("Open Food Facts mapping", () => {
  it("maps a found product", () => {
    const result = mapOpenFoodFactsProduct("3017620422003", {
      status: 1,
      product: {
        product_name: "Nutella",
        brands: "Ferrero",
        quantity: "400 g",
        categories: "Spreads",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.product.name).toBe("Nutella");
      expect(result.attribution).toMatch(/Open Food Facts/);
    }
  });

  it("handles not found", () => {
    const result = mapOpenFoodFactsProduct("000", { status: 0, product: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });
});

describe("lookupBarcode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports offline when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );
    vi.stubGlobal("navigator", { onLine: true });
    const result = await lookupBarcode("3017620422003");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("offline");
  });

  it("maps mocked OFF responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          status: 1,
          product: { product_name: "Test Milk", quantity: "1 L", categories: "Dairy" },
        }),
      })),
    );
    vi.stubGlobal("navigator", { onLine: true });
    const result = await lookupBarcode("3017620422003");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.name).toBe("Test Milk");
  });
});

describe("shelf life", () => {
  it("guesses category and expiry", () => {
    expect(guessCategoryFromName("Whole milk")).toBe("dairy");
    expect(guessCategoryFromName("Chicken thighs")).toBe("protein");
    const expiry = expiryFromShelfLife("protein", new Date("2026-10-15T12:00:00Z"));
    expect(expiry).toBe("2026-10-18");
  });
});
