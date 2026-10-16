"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Mascot } from "@/components/brand/mascot";
import { ScanConfirm } from "@/components/add/scan-confirm";
import { Button, Card, Chip } from "@/components/ui/sticker";
import { isLocalMode } from "@/lib/config";
import { draftFromBarcode, draftFromGuesses, type ConfirmDraft } from "@/lib/scan/confirm";
import { isValidBarcode, lookupBarcode } from "@/lib/scan/barcode";
import {
  isSecureForCamera,
  listVideoInputCount,
  mapGetUserMediaError,
  queryCameraPermissionHint,
  stopMediaStream,
  type CameraKind,
} from "@/lib/scan/camera";
import {
  CLIP_DOWNLOAD_MB,
  createClipRecognizer,
  createFallbackRecognizer,
  isPhotoScanEnabled,
  type Recognizer,
  type RecognizerProgress,
} from "@/lib/scan/recognizer";

type ScanMode = "barcode" | "photo";

async function detectBarcodeFromVideo(video: HTMLVideoElement): Promise<string | null> {
  const BarcodeDetectorCtor = (
    window as unknown as {
      BarcodeDetector?: new (options?: { formats: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
      };
    }
  ).BarcodeDetector;

  if (BarcodeDetectorCtor) {
    const detector = new BarcodeDetectorCtor({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
    });
    const codes = await detector.detect(video);
    return codes[0]?.rawValue ?? null;
  }

  const reader = new BrowserMultiFormatReader();
  try {
    const result = await reader.decodeOnceFromVideoElement(video);
    return result.getText();
  } catch {
    return null;
  }
}

function downscaleFile(file: File, max = 1280): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}

function CameraMessage({
  kind,
  permissionHint,
  onStart,
}: {
  kind: CameraKind;
  permissionHint: string | null;
  onStart: () => void;
}) {
  if (kind === "live" || kind === "requesting") return null;

  const copy: Record<Exclude<CameraKind, "live" | "requesting">, { title: string; body: string }> = {
    idle: {
      title: "Ready when you are",
      body: "Tap Start camera to preview. Your browser will ask for permission.",
    },
    denied: {
      title: "Camera permission is off",
      body: "Safari: Safari → Settings for This Website → Camera → Allow. Chrome: lock icon in the address bar → Site settings → Camera → Allow. iOS Safari: Settings → Safari → Camera, then reload and tap Try again.",
    },
    missing: {
      title: "No camera found",
      body: "This device doesn’t expose a camera. You can still upload a photo or use Manual.",
    },
    busy: {
      title: "Camera is busy",
      body: "Another app may be using it. Close that app, then tap Try again.",
    },
    overconstrained: {
      title: "Couldn’t match that camera",
      body: "Trying again usually works. You can also upload a photo.",
    },
    insecure: {
      title: "Camera needs HTTPS",
      body: "Open Kitchi on a secure page (or localhost) to use the live camera.",
    },
    unsupported: {
      title: "This browser can’t use the camera",
      body: "Try a recent Chrome, Edge, Firefox, or Safari — or upload a photo / use Manual.",
    },
  };

  const message = copy[kind];
  const showStart = kind === "idle" || kind === "denied" || kind === "busy" || kind === "overconstrained";

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-kitchi-cream/95 px-6 text-center"
      data-testid={`camera-state-${kind}`}
    >
      <Mascot mood={kind === "denied" ? "worried" : "sleepy"} size="lg" className="mx-auto" />
      <h3 className="mt-3 text-xl">{message.title}</h3>
      <p className="mt-2 text-sm text-kitchi-navy/75">{message.body}</p>
      {permissionHint ? (
        <p className="mt-2 text-xs font-bold text-kitchi-navy/60">{permissionHint}</p>
      ) : null}
      {showStart ? (
        <Button className="mt-4" data-testid="start-camera" onClick={onStart}>
          {kind === "idle" ? "Start camera" : "Try again"}
        </Button>
      ) : null}
    </div>
  );
}

export function ScanPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCodeRef = useRef<string>("");
  const lastAtRef = useRef(0);
  const facingRef = useRef<"environment" | "user">("environment");

  const [mode, setMode] = useState<ScanMode>("barcode");
  const [camera, setCamera] = useState<CameraKind>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ConfirmDraft[] | null>(null);
  const [holding, setHolding] = useState<ConfirmDraft[]>([]);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<RecognizerProgress | null>(null);
  const [recognizer, setRecognizer] = useState<Recognizer | null>(null);
  const [cameraCount, setCameraCount] = useState(0);
  const [permissionHint, setPermissionHint] = useState<string | null>(null);
  const photoEnabled = isPhotoScanEnabled();

  const teardown = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const refreshDeviceCount = useCallback(async () => {
    setCameraCount(await listVideoInputCount());
  }, []);

  const startCamera = useCallback(async () => {
    if (!isSecureForCamera()) {
      setCamera("insecure");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unsupported");
      return;
    }

    teardown();
    setCamera("requesting");
    const hint = await queryCameraPermissionHint();
    if (hint === "prompt") {
      setPermissionHint("Choose Allow when your browser asks.");
    } else if (hint === "denied") {
      setPermissionHint("This site’s camera permission looks blocked — use Try again after changing it.");
    } else {
      setPermissionHint(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingRef.current } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
      }
      setCamera("live");
      setPermissionHint(null);
      await refreshDeviceCount();
    } catch (error) {
      teardown();
      setCamera(mapGetUserMediaError(error));
    }
  }, [refreshDeviceCount, teardown]);

  const switchCamera = useCallback(async () => {
    facingRef.current = facingRef.current === "environment" ? "user" : "environment";
    await startCamera();
  }, [startCamera]);

  // Stop tracks on unmount and when the tab is hidden (deferred setState for lint).
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      teardown();
      window.setTimeout(() => {
        setCamera((current) => (current === "live" || current === "requesting" ? "idle" : current));
      }, 0);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      teardown();
    };
  }, [teardown]);

  const selectMode = useCallback(
    (next: ScanMode) => {
      if (next === mode) return;
      teardown();
      setMode(next);
      setCamera("idle");
      setStatus(null);
    },
    [mode, teardown],
  );

  const openDrafts = useCallback(
    (next: ConfirmDraft[]) => {
      teardown();
      setCamera("idle");
      setDrafts(next);
    },
    [teardown],
  );

  useEffect(() => {
    if (mode !== "barcode" || camera !== "live" || drafts) return;
    let active = true;
    const timer = window.setInterval(() => {
      void (async () => {
        const video = videoRef.current;
        if (!active || !video || video.readyState < 2) return;
        const code = await detectBarcodeFromVideo(video);
        if (!code || !isValidBarcode(code)) return;
        const now = Date.now();
        if (code === lastCodeRef.current && now - lastAtRef.current < 2500) return;
        lastCodeRef.current = code;
        lastAtRef.current = now;
        if (navigator.vibrate) navigator.vibrate(40);
        setStatus(`Looking up ${code}…`);
        const result = await lookupBarcode(code);
        if (!result.ok) {
          setStatus(`${result.message} Code kept: ${code}`);
          openDrafts([
            ...holding,
            {
              ...draftFromBarcode({ name: "", barcode: code }),
              name: "",
              selected: true,
              unsure: true,
            },
          ]);
          return;
        }
        setStatus(null);
        openDrafts([
          ...holding,
          draftFromBarcode({
            name: result.product.name,
            barcode: code,
            quantityText: result.product.quantityText,
            attribution: result.attribution,
          }),
        ]);
      })();
    }, 700);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [camera, drafts, holding, mode, openDrafts]);

  async function ensurePhotoModel() {
    setPhotoProgress({ stage: "download", progress: 0, message: "Preparing…" });
    try {
      const clip = await createClipRecognizer();
      await clip.ensureReady(setPhotoProgress);
      setRecognizer(clip);
      setPhotoConsent(true);
    } catch {
      const fallback = createFallbackRecognizer();
      await fallback.ensureReady(setPhotoProgress);
      setRecognizer(fallback);
      setPhotoConsent(true);
      setStatus("Photo Beta fell back to basic guesses. Double-check names.");
    }
  }

  async function handleCaptureOrUpload(file?: File) {
    const video = videoRef.current;
    let canvas: HTMLCanvasElement;
    if (file) {
      canvas = await downscaleFile(file);
    } else if (video && camera === "live") {
      canvas = document.createElement("canvas");
      const max = 1280;
      const scale = Math.min(1, max / Math.max(video.videoWidth || 640, video.videoHeight || 480));
      canvas.width = Math.max(1, Math.round((video.videoWidth || 640) * scale));
      canvas.height = Math.max(1, Math.round((video.videoHeight || 480) * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      setStatus("Start the camera first, or use Upload photo.");
      return;
    }

    if (mode === "photo") {
      if (!photoEnabled) {
        setStatus("Photo scan is turned off. Use Barcode or Manual.");
        return;
      }
      let active = recognizer;
      if (!photoConsent || !active) {
        active = createFallbackRecognizer();
        await active.ensureReady();
        setRecognizer(active);
        setPhotoConsent(true);
        setStatus("Using basic on-device guesses — double-check names before saving.");
      }
      setPhotoProgress({ stage: "classify", progress: 0.5, message: "Looking at the photo…" });
      const result = await active.recognize(canvas);
      setPhotoProgress(null);
      openDrafts([...holding, draftFromGuesses(result.guesses, result.unsure)]);
      return;
    }

    setStatus("Reading barcode from the frame…");
    try {
      const reader = new BrowserMultiFormatReader();
      const result = reader.decodeFromCanvas(canvas);
      const code = result.getText();
      const looked = await lookupBarcode(code);
      if (!looked.ok) {
        openDrafts([
          ...holding,
          { ...draftFromBarcode({ name: "", barcode: code }), unsure: true, selected: true },
        ]);
        setStatus(looked.message);
        return;
      }
      openDrafts([
        ...holding,
        draftFromBarcode({
          name: looked.product.name,
          barcode: code,
          attribution: looked.attribution,
        }),
      ]);
      setStatus(null);
    } catch {
      setStatus("Couldn't read a barcode. Try again or use Manual.");
    }
  }

  if (drafts) {
    return (
      <ScanConfirm
        drafts={drafts}
        onCancel={() => {
          setDrafts(null);
          setHolding([]);
          setStatus(null);
          setCamera("idle");
        }}
        onScanAnother={(current) => {
          setHolding(current);
          setDrafts(null);
          setCamera("idle");
          setStatus("Add another item — tap Start camera when you’re ready.");
        }}
      />
    );
  }

  return (
    <div className="text-left">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Scan mode">
        <Chip pressed={mode === "barcode"} onClick={() => selectMode("barcode")}>
          Barcode
        </Chip>
        <Chip
          pressed={mode === "photo"}
          onClick={() => selectMode("photo")}
          disabled={!photoEnabled}
        >
          Photo (Beta)
        </Chip>
      </div>

      {mode === "photo" ? (
        <p className="mt-3 text-sm font-bold text-kitchi-navy/75">
          Beta — works best with one item on a plain background. Photos never leave this device;
          model files download from Hugging Face when you opt in.
        </p>
      ) : (
        <p className="mt-3 text-sm font-bold text-kitchi-navy/75">
          Point at an EAN/UPC barcode. Lookups use Open Food Facts
          {isLocalMode() ? " directly from your browser" : ""}.
        </p>
      )}

      {mode === "photo" && photoEnabled && !photoConsent ? (
        <Card className="mt-4 px-4 py-5">
          <Mascot mood="cooking" size="md" className="mx-auto" />
          <p className="mt-2 text-center font-extrabold">
            One-time download of about {CLIP_DOWNLOAD_MB} MB. Works offline afterwards.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button onClick={() => void ensurePhotoModel()}>Download model</Button>
            <Button variant="steam" onClick={() => selectMode("barcode")}>
              Use Barcode instead
            </Button>
          </div>
          {photoProgress ? (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-kitchi-steam">
                <div
                  className="h-full bg-kitchi-orange"
                  style={{ width: `${Math.round(photoProgress.progress * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-center text-sm">{photoProgress.message}</p>
            </div>
          ) : null}
        </Card>
      ) : null}

      <div
        className="sticker-card relative mx-auto mt-4 aspect-[3/4] max-w-md overflow-hidden bg-kitchi-navy/10"
        data-testid="camera-frame"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
          aria-label="Camera preview"
          data-testid="camera-video"
        />
        {camera === "requesting" ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-kitchi-cream/95 px-6 text-center"
            data-testid="camera-state-requesting"
          >
            <Mascot mood="cooking" size="lg" className="mx-auto" />
            <h3 className="mt-3 text-xl">Asking for the camera…</h3>
            <p className="mt-2 text-kitchi-navy/75">Choose Allow when your browser asks.</p>
          </div>
        ) : null}
        <CameraMessage kind={camera} permissionHint={permissionHint} onStart={() => void startCamera()} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {camera === "live" ? (
          <Button
            className="min-h-14 min-w-14 rounded-full text-lg"
            data-testid="take-photo"
            onClick={() => void handleCaptureOrUpload()}
          >
            Take photo
          </Button>
        ) : (
          <Button data-testid="start-camera-secondary" variant="orange" onClick={() => void startCamera()}>
            Start camera
          </Button>
        )}
        {camera === "live" && cameraCount > 1 ? (
          <Button variant="steam" data-testid="switch-camera" onClick={() => void switchCamera()}>
            Switch camera
          </Button>
        ) : null}
        <label className="sticker-press cursor-pointer bg-kitchi-steam px-4 py-2 font-extrabold">
          Upload photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            data-testid="upload-photo"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleCaptureOrUpload(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {status ? (
        <p className="mt-3 text-center text-sm font-extrabold text-kitchi-navy" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
