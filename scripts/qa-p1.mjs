import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const outputDir = path.resolve("qa");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const checks = [];
const errors = [];

function check(condition, name, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) {
    throw new Error(`QA check failed: ${name}${detail ? ` (${detail})` : ""}`);
  }
}

async function newPage(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, locale: "zh-CN" });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  return { context, page };
}

async function loadPrivateDemo(page) {
  await page.getByRole("button", { name: /私定演示：见客外套/ }).click();
  await page.getByText("14 / 14 项已确认").waitFor({ timeout: 10_000 });
}

async function openDesign(page) {
  const mobileAction = page.locator(".mobile-stage-action button");
  if (await mobileAction.isVisible()) {
    await mobileAction.click();
  } else {
    await page.getByRole("button", { name: "整理设计方向" }).click();
  }
  await page.getByRole("heading", { name: "确认设计基线。" }).waitFor();
}

async function tabUntilFocused(page, selector, maxTabs = 80) {
  const target = page.locator(selector).first();
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) {
      return true;
    }
  }
  return false;
}

function mockedChatResponse(overrides) {
  return {
    reply: "需求已记录。",
    brief: {
      category: "",
      silhouette: "",
      shoulder: "",
      collar: "",
      fabric: "",
      color: "",
      pattern: "",
      length: "",
      ease: "",
      occasion: "",
      bodyNotes: "",
      exclusions: "",
      audience: "",
      quantity: "",
      ...overrides.brief,
    },
    confirmedFields: overrides.confirmedFields,
    tags: overrides.tags ?? [],
    readiness: overrides.readiness ?? 40,
    suggestedAnswers: [],
    source: "fallback",
  };
}

async function submitMockedChat(page, response) {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
  await page.getByLabel("描述你的定制需求").fill("现代海派旗袍，直身立领，精纺羊毛");
  await page.getByRole("button", { name: "发送需求" }).click();
  await page.locator(".thinking-line").waitFor({ state: "detached", timeout: 15_000 });
}

{
  const { context, page } = await newPage();
  const footerButton = page.locator(".brief-panel__footer > .primary-button");
  const footerBox = await footerButton.boundingBox();
  check(Boolean(footerBox && footerBox.y + footerBox.height <= 900), "desktop brief primary action stays above fold");

  await loadPrivateDemo(page);
  await page.getByRole("button", { name: "团体职业服" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  check(
    (await page.evaluate(() => document.activeElement?.textContent?.trim())) ===
      "保留当前方案",
    "destructive dialog focuses the safe action",
  );
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  check(
    (await page.getByText("14 / 14 项已确认").count()) > 0,
    "canceling a mode change preserves confirmed data",
  );
  check(
    (await page.getByRole("button", { name: "高端私定" }).getAttribute("aria-pressed")) ===
      "true",
    "canceling a mode change preserves the work mode",
  );

  await openDesign(page);
  check(
    (await page.getByRole("heading", { name: "方案初稿" }).count()) === 1,
    "proposal draft is present",
  );
  await page.locator(".generation-settings > summary").click();
  await page.locator(".generation-settings > summary").focus();
  const firstRadio = page.locator(".model-choice input").first();
  check(await tabUntilFocused(page, ".model-choice input"), "keyboard can reach image quality radios");
  const radioOutline = await firstRadio.evaluate((input) => {
    const parent = input.closest(".model-choice");
    return parent ? getComputedStyle(parent).outlineStyle : "missing";
  });
  check(radioOutline !== "none", "radio focus is visible on its card", radioOutline);

  await page.locator(".prompt-box:not(.generation-settings) > summary").click();
  const tabs = page.locator(".prompt-box:not(.generation-settings) [role='tab']");
  check((await tabs.count()) === 3, "three prompt variants render");
  const prompts = [];
  for (let index = 0; index < 3; index += 1) {
    await tabs.nth(index).click();
    prompts.push(await page.locator(".prompt-box:not(.generation-settings) pre").innerText());
  }
  check(new Set(prompts).size === 3, "prompt tabs expose distinct content");
  check(
    prompts.every((prompt) => prompt.includes("Use only the confirmed requirements")),
    "prompts state the confirmed-only rule",
  );
  check(
    prompts.every((prompt) => !/待定|待确认|建议/.test(prompt)),
    "prompts exclude unconfirmed placeholders",
  );
  check(
    (await page.getByRole("button", { name: "复制三套" }).count()) === 1,
    "copy-all prompt action is available",
  );

  await page.getByRole("button", { name: "用这个方向选面料" }).click();
  await page.getByRole("heading", { name: "选面料，先看体感。" }).waitFor();
  await page.getByRole("button", { name: "确认面料" }).click();
  await page.getByRole("heading", { name: "把舒适变成参数。" }).waitFor();
  const patternAction = await page
    .getByRole("button", { name: "生成版型交接单" })
    .boundingBox();
  check(
    Boolean(patternAction && patternAction.y >= 0 && patternAction.y + patternAction.height <= 900),
    "pattern handoff action is visible in the first viewport",
  );
  await page.getByRole("button", { name: "生成版型交接单" }).click();
  await page.getByRole("heading", { name: "检查能活动，再谈好看。" }).waitFor();
  const firstCheckbox = page.locator(".check-row input").first();
  check(await tabUntilFocused(page, ".check-row input"), "keyboard can reach sample checkboxes");
  const checkboxOutline = await firstCheckbox.evaluate((input) => {
    const parent = input.closest(".check-row");
    return parent ? getComputedStyle(parent).outlineStyle : "missing";
  });
  check(checkboxOutline !== "none", "checkbox focus is visible on its row", checkboxOutline);
  await context.close();
}

{
  const { context, page } = await newPage();
  const response = mockedChatResponse({
    brief: {
      category: "现代海派旗袍",
      bodyNotes: "肩背较宽",
      exclusions: "不要亮片",
      audience: "单人私定",
      quantity: "1 件",
    },
    confirmedFields: ["category", "bodyNotes", "exclusions", "audience", "quantity"],
    tags: ["旗袍", "克制"],
  });
  await submitMockedChat(page, response);
  const button = page.locator(".brief-panel__footer > .primary-button");
  check(await button.isDisabled(), "non-design confirmations cannot unlock design");
  check(
    (await button.innerText()).includes("再确认 3 个设计字段"),
    "gate explains the remaining design fields",
    await button.innerText(),
  );
  await context.close();
}

{
  const { context, page } = await newPage();
  const response = mockedChatResponse({
    brief: {
      category: "现代海派旗袍",
      silhouette: "直身微收",
      collar: "低立领",
      fabric: "精纺羊毛",
      bodyNotes: "肩背较宽",
      audience: "单人私定",
      quantity: "1 件",
    },
    confirmedFields: ["category", "silhouette", "collar", "fabric", "bodyNotes", "audience", "quantity"],
    tags: ["旗袍", "海派", "克制"],
  });
  await submitMockedChat(page, response);
  await page.getByRole("button", { name: "查看匹配缺口" }).click();
  await page.getByRole("heading", { name: "确认设计基线。" }).waitFor();
  check(
    (await page.locator(".direction-card").count()) === 0,
    "unsupported categories do not fall back to outerwear or shirts",
  );
  check(
    (await page.getByText("暂无同品类企业资产").count()) > 0,
    "unsupported categories show an explicit asset gap",
  );
  await context.close();
}

{
  const { context, page } = await newPage({ width: 1024, height: 768 });
  await loadPrivateDemo(page);
  const mobileAction = page.locator(".mobile-stage-action button");
  check(await mobileAction.isVisible(), "tablet exposes a sticky primary action");
  check(
    await mobileAction.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    }),
    "tablet primary action is visible after loading a case",
  );
  await mobileAction.click();
  await page.getByRole("heading", { name: "确认设计基线。" }).waitFor();
  await page.waitForTimeout(350);
  const settingsBox = await page.locator(".settings-panel").boundingBox();
  const directionsBox = await page.locator(".section-line-head").first().boundingBox();
  check(
    Boolean(settingsBox && directionsBox && settingsBox.y < directionsBox.y),
    "tablet decisions come before media",
  );
  const continueBox = await page
    .locator(".settings-panel > .primary-button")
    .boundingBox();
  check(
    Boolean(continueBox && continueBox.y + continueBox.height <= 768),
    "tablet continue action is visible without deep scrolling",
  );
  check(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    "tablet layout has no horizontal overflow",
  );
  await context.close();
}

{
  const { context, page } = await newPage({ width: 390, height: 844 });
  check(
    (await page.locator(".mobile-stages [aria-current='step']").count()) === 1,
    "mobile stage navigation marks exactly one current step",
  );
  const composer = await page.locator(".composer").boundingBox();
  const stageStrip = await page.locator(".mobile-stages").boundingBox();
  check(
    Boolean(composer && stageStrip && composer.y + composer.height <= stageStrip.y),
    "mobile composer stays clear of the fixed stage strip",
  );
  check(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    "mobile layout has no horizontal overflow",
  );
  await page.screenshot({ path: path.join(outputDir, "p1-mobile-layout.png") });
  await context.close();
}

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  checks,
  browserErrors: errors,
};
await writeFile(
  path.join(outputDir, "p1-report.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`P1 QA complete: ${checks.length} assertions passed.`);
}
