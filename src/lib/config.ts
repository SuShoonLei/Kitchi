export function apiBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) return null;
  return value.replace(/\/$/, "");
}

export function isDemoMode(): boolean {
  return apiBaseUrl() == null;
}
