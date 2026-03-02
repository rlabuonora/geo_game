import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const viewport = {
  width: 1365,
  height: 768
};

const latestDir = path.resolve(process.cwd(), "screenshots/latest");

function getBaseUrl() {
  return process.env.SCREENSHOT_BASE_URL ?? "http://localhost:5173";
}

export async function captureScreen(name: string, query: string) {
  await mkdir(latestDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
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
