import { FOOD_LABELS, type FoodLabel } from "@/lib/foodLabels";

export type RecognitionGuess = {
  label: FoodLabel;
  confidence: number;
};

export type RecognitionResult = {
  guesses: RecognitionGuess[];
  /** True when the top guess is under the confidence floor. */
  unsure: boolean;
};

export type RecognizerProgress = {
  stage: "download" | "encode" | "classify" | "done" | "error";
  progress: number;
  message: string;
};

/**
 * Swappable on-device image recognizer.
 * CLIP-backed implementation downloads model weights from Hugging Face CDN.
 */
export type Recognizer = {
  id: string;
  /** Approximate one-time download size shown in consent copy. */
  downloadMb: number;
  ensureReady: (onProgress?: (progress: RecognizerProgress) => void) => Promise<void>;
  recognize: (imageBitmap: ImageBitmap | HTMLCanvasElement) => Promise<RecognitionResult>;
  dispose?: () => void;
};

export const CONFIDENCE_FLOOR = 0.5;

/** Rough download size for Xenova CLIP ViT-B/32 (CDN weights, not bundled). */
export const CLIP_DOWNLOAD_MB = 90;

function canvasFromBitmap(source: ImageBitmap | HTMLCanvasElement): HTMLCanvasElement {
  if (source instanceof HTMLCanvasElement) return source;
  const canvas = document.createElement("canvas");
  const max = 1280;
  const scale = Math.min(1, max / Math.max(source.width, source.height));
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a drawing surface.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Lightweight recognizer used when Transformers.js can't load.
 * Results stay under the confidence floor so confirm starts unselected.
 */
export function createFallbackRecognizer(): Recognizer {
  return {
    id: "fallback-heuristic",
    downloadMb: 0,
    async ensureReady(onProgress) {
      onProgress?.({ stage: "done", progress: 1, message: "Ready (basic guesses)." });
    },
    async recognize(source) {
      const canvas = canvasFromBitmap(source);
      const ctx = canvas.getContext("2d");
      if (!ctx) return { guesses: [], unsure: true };
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let r = 0;
      let g = 0;
      let b = 0;
      const step = 16 * 4;
      let samples = 0;
      for (let i = 0; i < data.length; i += step) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        samples += 1;
      }
      r /= samples;
      g /= samples;
      b /= samples;

      const scored = FOOD_LABELS.map((label) => {
        const name = label.name.toLowerCase();
        let score = 0.15;
        if (r > 120 && g < 100 && /(tomato|chili|pepper|salsa|ketchup)/.test(name)) score += 0.25;
        if (g > r && g > b && /(spinach|lettuce|basil|cabbage|bok|broccoli|peas)/.test(name)) {
          score += 0.25;
        }
        if (r > 140 && g > 120 && b < 90 && /(onion|potato|ginger|egg|cheese|pasta|bread)/.test(name)) {
          score += 0.15;
        }
        if (r > 150 && g > 140 && b > 120 && /(rice|tofu|milk|yogurt|flour)/.test(name)) score += 0.12;
        return { label, confidence: Math.min(0.49, score) };
      })
        .sort((a, c) => c.confidence - a.confidence)
        .slice(0, 3);

      return { guesses: scored, unsure: true };
    },
  };
}

type ClipClassifier = (
  image: string,
  labels: string[],
  options?: { top_k?: number },
) => Promise<Array<{ label: string; score: number }>>;

let clipSingleton: Recognizer | null = null;

/**
 * CLIP zero-shot recognizer via @huggingface/transformers (CDN weights).
 * Falls back if the package or runtime path fails.
 */
export async function createClipRecognizer(): Promise<Recognizer> {
  if (clipSingleton) return clipSingleton;
  try {
    // Dynamic import keeps the heavy package out of the initial bundle path.
    const transformers = (await import("@huggingface/transformers")) as {
      pipeline: (
        task: string,
        model: string,
        options?: { progress_callback?: (info: { progress?: number; status?: string }) => void },
      ) => Promise<ClipClassifier>;
      env: { allowLocalModels: boolean; useBrowserCache: boolean };
    };
    const { pipeline, env } = transformers;
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    let classifier: ClipClassifier | null = null;
    const labels = FOOD_LABELS.map((item) => item.name);

    const recognizer: Recognizer = {
      id: "clip-xenova",
      downloadMb: CLIP_DOWNLOAD_MB,
      async ensureReady(onProgress) {
        onProgress?.({
          stage: "download",
          progress: 0.05,
          message: "Downloading the on-device model…",
        });
        classifier = await pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", {
          progress_callback: (event) => {
            const progress = Math.min(0.95, Math.max(0.05, (event.progress ?? 0) / 100));
            onProgress?.({
              stage: "download",
              progress,
              message: "Downloading the on-device model…",
            });
          },
        });
        onProgress?.({ stage: "done", progress: 1, message: "Model ready." });
      },
      async recognize(source) {
        if (!classifier) throw new Error("Recognizer is not ready.");
        const canvas = canvasFromBitmap(source);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const output = await classifier(dataUrl, labels, { top_k: 3 });
        const guesses = output.map((row) => {
          const label = FOOD_LABELS.find((item) => item.name === row.label) ?? FOOD_LABELS[0];
          return { label, confidence: row.score };
        });
        const top = guesses[0]?.confidence ?? 0;
        return { guesses, unsure: top < CONFIDENCE_FLOOR };
      },
      dispose() {
        classifier = null;
        clipSingleton = null;
      },
    };
    clipSingleton = recognizer;
    return recognizer;
  } catch {
    return createFallbackRecognizer();
  }
}

export function isPhotoScanEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_PHOTO_SCAN?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  return true;
}
