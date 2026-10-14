const DEVICE_KEY = "kitchi-device-id";

export function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_KEY, created);
  return created;
}

export function clearDeviceId(): void {
  window.localStorage.removeItem(DEVICE_KEY);
}

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
