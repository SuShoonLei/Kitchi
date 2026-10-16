import { describe, expect, it } from "vitest";
import { mapGetUserMediaError } from "@/lib/scan/camera";

describe("mapGetUserMediaError", () => {
  it("maps browser error names", () => {
    expect(mapGetUserMediaError(Object.assign(new Error("no"), { name: "NotAllowedError" }))).toBe(
      "denied",
    );
    expect(mapGetUserMediaError(Object.assign(new Error("no"), { name: "NotFoundError" }))).toBe(
      "missing",
    );
    expect(mapGetUserMediaError(Object.assign(new Error("no"), { name: "NotReadableError" }))).toBe(
      "busy",
    );
    expect(
      mapGetUserMediaError(Object.assign(new Error("no"), { name: "OverconstrainedError" })),
    ).toBe("overconstrained");
    expect(mapGetUserMediaError(Object.assign(new Error("no"), { name: "TypeError" }))).toBe(
      "unsupported",
    );
  });
});
