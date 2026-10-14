import { describe, expect, it } from "vitest";
import { apiHeaders, toWireCategory, toWireCuisine } from "@/lib/wire";

describe("api headers", () => {
  it("sends the device id and timezone on every request", () => {
    const headers = apiHeaders("11111111-1111-4111-8111-111111111111", "America/New_York");
    expect(headers["X-Device-Id"]).toBe("11111111-1111-4111-8111-111111111111");
    expect(headers["X-Timezone"]).toBe("America/New_York");
    expect(headers.Accept).toBe("application/json");
  });
});

describe("wire enums", () => {
  it("keeps pantry categories lowercase", () => {
    expect(toWireCategory("Produce")).toBe("produce");
    expect(toWireCategory("protein")).toBe("protein");
  });

  it("sends cuisines in title case", () => {
    expect(toWireCuisine("vietnamese")).toBe("Vietnamese");
    expect(toWireCuisine("BURMESE")).toBe("Burmese");
    expect(toWireCuisine("Mediterranean")).toBe("Mediterranean");
  });

  it("rejects values the backend does not know", () => {
    expect(() => toWireCategory("snacks")).toThrow(/category/);
    expect(() => toWireCuisine("Martian")).toThrow(/cuisine/);
  });
});
