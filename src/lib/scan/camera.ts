export type CameraKind =
  | "idle"
  | "requesting"
  | "live"
  | "denied"
  | "missing"
  | "busy"
  | "overconstrained"
  | "insecure"
  | "unsupported";

export type CameraState = { kind: CameraKind };

export function isSecureForCamera(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext || location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

export function mapGetUserMediaError(error: unknown): CameraKind {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "missing";
  if (name === "NotReadableError" || name === "TrackStartError") return "busy";
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "overconstrained";
  }
  return "unsupported";
}

export function stopMediaStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function queryCameraPermissionHint(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  try {
    const permissions = navigator.permissions;
    if (!permissions?.query) return "unknown";
    // Safari often rejects or omits "camera".
    const status = await permissions.query({ name: "camera" as PermissionName });
    if (status.state === "granted" || status.state === "denied" || status.state === "prompt") {
      return status.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

export async function listVideoInputCount(): Promise<number> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return 0;
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput").length;
  } catch {
    return 0;
  }
}
