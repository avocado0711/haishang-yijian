import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const widths = [1440, 1024, 820, 768, 390, 320];
let failed = false;

for (const width of widths) {
  const height = width >= 768 ? 900 : 844;
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "zh-CN",
  });
  const page = await context.newPage();
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  const result = await page.evaluate(() => {
    const html = document.documentElement;
    const composer = document.querySelector(".composer");
    const rect = composer?.getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      scrollWidth: html.scrollWidth,
      composerBottom: rect?.bottom ?? null,
      viewportHeight: window.innerHeight,
    };
  });
  const overflow = result.scrollWidth > result.viewport + 1;
  const composerVisible =
    result.composerBottom !== null &&
    result.composerBottom <= result.viewportHeight + 1;
  console.log(
    `${width}px overflow=${overflow} composerVisible=${composerVisible}`,
  );
  if (overflow || (width <= 640 && !composerVisible)) failed = true;
  await context.close();
}

await browser.close();
if (failed) process.exitCode = 1;
