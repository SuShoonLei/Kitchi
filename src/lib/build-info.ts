/** Public build stamp — commit hash is not a secret. */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.npm_package_version ?? "0.1.0";

export const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";

export function buildStamp(): string {
  return `${APP_VERSION} · ${GIT_SHA}`;
}
