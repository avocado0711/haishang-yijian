import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const outputDir = path.resolve("qa");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
});

const errors = [];
const checks = [];

function check(condition, name, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) throw new Error(`QA check failed: ${name}${detail ? ` (${detail})` : ""}`);
}

async function newPage(viewport) {
  const context = await browser.newContext({
    viewport,
    locale: "zh-CN",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  return { context, page };
}

async function openDemo(page, label) {
  await page.getByRole("button", { name: new RegExp(label) }).click();
  await page.getByText("14 / 14 项已确认").waitFor({ timeout: 10_000 });
}

async function openMobileAction(page, name) {
  const action = page.locator(".mobile-stage-action button");
  if (await action.isVisible()) {
    await action.click();
    return;
  }
  await page.getByRole("button", { name }).click();
}

async function completeFlow({
  name,
  viewport,
  demoLabel,
  expectedProduct,
  expectedCollar,
  screenshotPrefix,
  submit,
}) {
  const { context, page } = await newPage(viewport);
  await page.screenshot({
    path: path.join(outputDir, `${screenshotPrefix}-01-brief.png`),
  });

  await openDemo(page, demoLabel);
  const selectedProduct = await page.locator(".direction-card--selected h3").count();
  check(selectedProduct === 0 || selectedProduct === 1, `${name}: valid initial state`);

  await openMobileAction(page, "整理设计方向");
  await page.getByRole("heading", { name: "确认设计基线。" }).waitFor();
  const productName = await page.locator(".direction-card--selected h3").innerText();
  check(productName === expectedProduct, `${name}: category-safe product match`, productName);
  check(
    (await page.getByRole("heading", { name: "方案初稿" }).count()) === 1,
    `${name}: proposal draft is visible`,
  );

  await page.locator(".asset-library > summary").click();
  await page.getByRole("tab", { name: "案例" }).click();
  check(
    (await page.locator(".asset-list article").count()) > 0,
    `${name}: searchable enterprise asset library`,
  );
  await page.screenshot({
    path: path.join(outputDir, `${screenshotPrefix}-02-design.png`),
    fullPage: true,
  });

  await page.locator(".generation-settings > summary").click();
  await page.getByRole("button", { name: "生成设计方案图" }).click();
  await page.getByRole("button", { name: "生成设计方案图" }).waitFor({
    state: "visible",
    timeout: 60_000,
  });
  await page.locator(".prompt-box:not(.generation-settings) > summary").click();
  const prompt = await page
    .locator(".prompt-box:not(.generation-settings) pre")
    .innerText();
  check(
    prompt.includes("Use only the confirmed requirements"),
    `${name}: structured visual prompt`,
  );
  check(!/待定|待确认|建议/.test(prompt), `${name}: prompt excludes unconfirmed placeholders`);
  check(
    (await page.locator(".prompt-box [role='tab']").count()) === 3,
    `${name}: three visual prompt variants`,
  );
  check(
    (await page.getByRole("button", { name: "复制三套" }).count()) === 1,
    `${name}: copy-all prompt action is available`,
  );

  await page.getByRole("button", { name: "用这个方向选面料" }).click();
  await page.getByRole("heading", { name: "选面料，先看体感。" }).waitFor();
  await page.screenshot({
    path: path.join(outputDir, `${screenshotPrefix}-03-fabric.png`),
    fullPage: true,
  });

  await page.getByRole("button", { name: "确认面料" }).click();
  await page.getByRole("heading", { name: "把舒适变成参数。" }).waitFor();
  const selectedPattern = await page
    .locator(".segmented button[aria-pressed='true']")
    .allTextContents();
  check(
    selectedPattern.some((value) => value.includes(expectedCollar)),
    `${name}: collar derived from confirmed brief`,
    selectedPattern.join(" / "),
  );
  await page.screenshot({
    path: path.join(outputDir, `${screenshotPrefix}-04-pattern.png`),
    fullPage: true,
  });

  await page.getByRole("button", { name: "生成版型交接单" }).click();
  await page.getByRole("heading", { name: "检查能活动，再谈好看。" }).waitFor();
  const sampleRows = await page.locator(".check-row > span:nth-of-type(2)").allTextContents();
  check(
    sampleRows.some((value) => value.includes(expectedCollar)),
    `${name}: sample checklist derived from current collar`,
    sampleRows.join(" / "),
  );
  for (const row of await page.locator(".check-row").all()) {
    await row.click();
  }
  await page.screenshot({
    path: path.join(outputDir, `${screenshotPrefix}-05-sample.png`),
    fullPage: true,
  });

  await page.getByRole("button", { name: "记录检查并生成方案" }).click();
  await page.getByRole("heading", { name: "生成可接手的方案。" }).waitFor();
  check(
    (await page.locator(".delivery-hero__main img").getAttribute("src")) ===
      `/assets/catalog/${expectedProduct === "海派接待职业服" ? "panel-jacket.png" : "xuanwen-coat.jpg"}`,
    `${name}: final visual uses selected enterprise asset`,
  );
  const ledgerPrompt = await page.locator(".delivery-ledger pre").innerText();
  check(ledgerPrompt.length > 120, `${name}: prompt included in handoff ledger`);
  check(
    (await page.locator(".delivery-ledger [role='tab']").count()) === 3,
    `${name}: three prompt variants in handoff ledger`,
  );
  await page.getByLabel("业务台账备注").fill("演示备注：先复核肩背活动量。");
  check(
    (await page.getByLabel("业务台账备注").inputValue()).includes("肩背活动量"),
    `${name}: editable ledger notes`,
  );
  await page.screenshot({
    path: path.join(outputDir, `${screenshotPrefix}-06-delivery.png`),
    fullPage: true,
  });

  if (submit) {
    await page.getByLabel("联系人称呼").fill("林女士");
    await page.getByLabel("联系电话或微信").fill("13800000000");
    await page.getByLabel("所在城市").fill("上海");
    await page.getByLabel("补充说明").fill("希望先确认肩背余量。");
    await page.getByRole("button", { name: "生成交接台账" }).click();
    await page.getByRole("heading", { name: "业务交接台账已生成。" }).waitFor({
      timeout: 30_000,
    });
    await page.screenshot({
      path: path.join(outputDir, `${screenshotPrefix}-07-success.png`),
    });
  }

  await context.close();
}

await completeFlow({
  name: "private",
  viewport: { width: 1440, height: 900 },
  demoLabel: "私定演示：见客外套",
  expectedProduct: "玄纹立领外套",
  expectedCollar: "立领",
  screenshotPrefix: "desktop-private",
  submit: true,
});

await completeFlow({
  name: "uniform",
  viewport: { width: 1280, height: 900 },
  demoLabel: "职业服演示：接待团队",
  expectedProduct: "海派接待职业服",
  expectedCollar: "立领",
  screenshotPrefix: "desktop-uniform",
  submit: true,
});

for (const [label, viewport] of [
  ["mobile", { width: 390, height: 844 }],
  ["tablet", { width: 1024, height: 768 }],
]) {
  const session = await newPage(viewport);
  await session.page.screenshot({
    path: path.join(outputDir, `responsive-${label}-brief.png`),
  });
  const composer = await session.page.locator(".composer").boundingBox();
  check(
    Boolean(composer && composer.y + composer.height <= viewport.height),
    `${label}: composer visible in first viewport`,
  );
  const primaryAction = await session.page.locator(".mobile-stage-action button").boundingBox();
  check(
    Boolean(
      primaryAction &&
        primaryAction.y >= 0 &&
        primaryAction.y + primaryAction.height <= viewport.height,
    ),
    `${label}: primary next step visible in first viewport`,
  );
  await session.context.close();
}

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  checks,
  browserErrors: errors,
};
await writeFile(
  path.join(outputDir, "e2e-report.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`QA complete: ${checks.length} assertions passed.`);
}
