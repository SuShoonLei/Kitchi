import { expect, test } from "@playwright/test";
import { skipIntro } from "./helpers";

// Fake camera flags come from playwright.config.ts launchOptions.

test.describe("Scan camera", () => {
  test("live preview after Start camera with fake media stream", async ({ browser }) => {
    const context = await browser.newContext();
    // Chromium fake camera (launch args also set in playwright project via fixture below).
    await context.grantPermissions(["camera"]);
    const page = await context.newPage();
    await skipIntro(page);
    await page.goto("/add");

    await expect(page.getByTestId("camera-state-idle")).toBeVisible();
    await expect(page.getByTestId("start-camera")).toBeVisible();

    await page.getByTestId("start-camera").click();

    await expect(page.getByTestId("camera-video")).toBeVisible();
    await expect(page.getByTestId("take-photo")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("camera-state-idle")).toHaveCount(0);
    await expect(page.getByTestId("camera-state-denied")).toHaveCount(0);

    const hasStream = await page.evaluate(() => {
      const video = document.querySelector('[data-testid="camera-video"]') as HTMLVideoElement | null;
      const stream = video?.srcObject as MediaStream | null;
      return Boolean(stream && stream.getVideoTracks().length > 0);
    });
    expect(hasStream).toBe(true);

    await context.close();
  });

  test("permission denied shows friendly instructions and Try again", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await skipIntro(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            const error = new Error("Permission denied");
            error.name = "NotAllowedError";
            throw error;
          },
          enumerateDevices: async () => [],
        },
      });
    });
    await page.goto("/add");
    await page.getByTestId("start-camera").click();
    await expect(page.getByTestId("camera-state-denied")).toBeVisible();
    await expect(page.getByText(/Camera permission is off/i)).toBeVisible();
    await expect(page.getByText(/Safari:/i)).toBeVisible();
    await expect(page.getByText(/Chrome:/i)).toBeVisible();
    await expect(page.getByText(/iOS Safari:/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Try again/i })).toBeVisible();
    await context.close();
  });

  test("no camera device shows missing state", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await skipIntro(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            const error = new Error("Requested device not found");
            error.name = "NotFoundError";
            throw error;
          },
          enumerateDevices: async () => [],
        },
      });
    });
    await page.goto("/add");
    await page.getByTestId("start-camera").click();
    await expect(page.getByTestId("camera-state-missing")).toBeVisible();
    await expect(page.getByText(/No camera found/i)).toBeVisible();
    await expect(page.getByTestId("upload-photo")).toBeAttached();
    await context.close();
  });
});
