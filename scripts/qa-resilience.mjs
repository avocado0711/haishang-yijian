import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const outputDir = path.resolve("qa");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "zh-CN",
});
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    !message.text().includes("net::ERR_FAILED")
  ) {
    errors.push(message.text());
  }
});
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => window.localStorage.clear());
await page.goto(baseUrl, { waitUntil: "networkidle" });

let dropChat = true;
await page.route("**/api/chat", async (route) => {
  if (dropChat) {
    await route.abort("failed");
    return;
  }
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      reply: "在线模型已恢复，刚才确认的内容仍然保留。",
      brief: {
        category: "外套",
        silhouette: "直身宽松，肩背与袖笼保留活动量",
        shoulder: "无结构自然肩",
        collar: "立领",
        fabric: "精纺羊毛混纺",
        color: "低饱和墨色",
        pattern: "同色暗纹",
        length: "盖过胯骨",
        ease: "宽松但不板正",
        occasion: "见客谈事",
        bodyNotes: "肩背较宽",
        exclusions: "不要亮片",
        audience: "单人私定",
        quantity: "1 件",
      },
      confirmedFields: [
        "category",
        "silhouette",
        "shoulder",
        "collar",
        "fabric",
        "color",
        "pattern",
        "length",
        "ease",
        "occasion",
        "bodyNotes",
        "exclusions",
        "audience",
        "quantity",
      ],
      tags: ["新中式", "立领", "见客"],
      readiness: 92,
      suggestedAnswers: [],
      source: "deepseek",
    }),
  });
});

const composer = page.getByLabel("描述你的定制需求");
await composer.fill("做一件正式但不拘束的新中式外套");
await page.getByRole("button", { name: "发送需求" }).click();
await page.locator(".thinking-line").waitFor({ state: "detached", timeout: 15_000 });
await page.getByText("本地归纳").waitFor();

await composer.fill("颜色希望低调耐看");
await page.getByRole("button", { name: "发送需求" }).click();
await page.locator(".thinking-line").waitFor({ state: "detached", timeout: 15_000 });
const colorValue = await page
  .locator(".brief-field")
  .filter({ hasText: "色彩" })
  .locator("strong")
  .innerText();
const repeatedColor = await page
  .getByRole("button", { name: "低饱和墨色或藏青" })
  .count();
await page.screenshot({
  path: path.join(outputDir, "resilience-local-fallback.png"),
  fullPage: false,
});

dropChat = false;
await page.getByRole("button", { name: "重试在线模型" }).click();
await page.getByText("AI 在线").waitFor({ timeout: 15_000 });
await page.getByText("在线模型已恢复，刚才确认的内容仍然保留。").waitFor();
await page.screenshot({
  path: path.join(outputDir, "resilience-recovered.png"),
  fullPage: false,
});

const checks = [
  {
    name: "network failure degrades without losing the interface",
    passed: colorValue.length > 0,
    detail: colorValue,
  },
  {
    name: "local fallback fills color instead of repeating the same question",
    passed: repeatedColor === 0,
    detail: `repeatedColor=${repeatedColor}`,
  },
  {
    name: "manual retry restores online model",
    passed: true,
    detail: "AI 在线",
  },
];

await writeFile(
  path.join(outputDir, "resilience-report.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      checks,
      browserErrors: errors,
    },
    null,
    2,
  ),
  "utf8",
);

await context.close();
await browser.close();

if (checks.some((item) => !item.passed) || errors.length > 0) {
  console.error(JSON.stringify({ checks, errors }, null, 2));
  process.exitCode = 1;
} else {
  console.log("Resilience QA complete: 3 assertions passed.");
}
