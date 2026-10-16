export type DataMode = "local" | "api";

/**
 * Public edition selector.
 * - `local` (default): in-browser journal (SQLite WASM in later steps; Zustand journal for now).
 * - `api`: full-stack edition against the Spring Boot backend. Requires NEXT_PUBLIC_API_URL.
 */
export function dataMode(): DataMode {
  const raw = process.env.NEXT_PUBLIC_DATA_MODE?.trim().toLowerCase();
  if (raw === "api") return "api";
  return "local";
}

export function isLocalMode(): boolean {
  return dataMode() === "local";
}

/** @deprecated Prefer isLocalMode(). Kept temporarily for call sites mid-migration. */
export function isDemoMode(): boolean {
  return isLocalMode();
}

export function apiBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) return null;
  return value.replace(/\/$/, "");
}

/** Throws when api mode is selected without a base URL. */
export function requireApiBaseUrl(): string {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_DATA_MODE=api requires NEXT_PUBLIC_API_URL (for example http://localhost:8080).",
    );
  }
  return base;
}
