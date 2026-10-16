import { afterEach, describe, expect, it, vi } from "vitest";

describe("data mode selection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to local when NEXT_PUBLIC_DATA_MODE is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    const { dataMode, isLocalMode } = await import("@/lib/config");
    const { getDataSource } = await import("@/lib/data-source");
    expect(dataMode()).toBe("local");
    expect(isLocalMode()).toBe(true);
    expect(getDataSource().mode).toBe("local");
  });

  it("uses the API source when NEXT_PUBLIC_DATA_MODE=api", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "api");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
    const { dataMode, isLocalMode, apiBaseUrl } = await import("@/lib/config");
    const { getDataSource } = await import("@/lib/data-source");
    expect(dataMode()).toBe("api");
    expect(isLocalMode()).toBe(false);
    expect(apiBaseUrl()).toBe("http://localhost:8080");
    expect(getDataSource().mode).toBe("api");
  });

  it("treats unknown DATA_MODE values as local", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "cloud");
    const { dataMode } = await import("@/lib/config");
    expect(dataMode()).toBe("local");
  });

  it("requires NEXT_PUBLIC_API_URL in api mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "api");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    const { requireApiBaseUrl } = await import("@/lib/config");
    expect(() => requireApiBaseUrl()).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it("strips a trailing slash from the API base URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080/");
    const { apiBaseUrl } = await import("@/lib/config");
    expect(apiBaseUrl()).toBe("http://localhost:8080");
  });
});
