import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const viewports = {
  wide: {
    width: 1365,
    height: 768
  },
  mobile: {
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true
  }
} as const;

type ViewportProfile = keyof typeof viewports;

function getViewportProfile(): ViewportProfile {
  return process.env.SCREENSHOT_VIEWPORT === "mobile" ? "mobile" : "wide";
}

function getLatestDir() {
  return path.resolve(process.cwd(), "screenshots/latest", getViewportProfile());
}

function getBaseUrl() {
  return process.env.SCREENSHOT_BASE_URL ?? "http://localhost:5173";
}

export async function captureScreen(name: string, query: string) {
  const latestDir = getLatestDir();

  await mkdir(latestDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: viewports[getViewportProfile()] });
  const url = `${getBaseUrl()}/${query ? `?${query}` : ""}`;

  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30_000
    });

    if (!response || !response.ok()) {
      throw new Error(`Could not load ${url}. Check that the dev server is running.`);
    }

    await page.waitForTimeout(900);
    await page.screenshot({
      path: path.join(latestDir, `${name}.png`),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}
