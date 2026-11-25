import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BRIEF_FIELDS,
  EMPTY_BRIEF,
  fallbackAgentReply,
  readinessFromBrief,
  sanitizeConfirmedFields,
} from "@/lib/brief";
import type { BriefKey, DesignBrief, WorkMode } from "@/lib/types";

const BriefKeySchema = z.enum(
  BRIEF_FIELDS.map((field) => field.key) as [BriefKey, ...BriefKey[]],
);

const BriefSchema = z.object({
  category: z.string(),
  silhouette: z.string(),
  shoulder: z.string(),
  collar: z.string(),
  fabric: z.string(),
  color: z.string(),
  pattern: z.string(),
  length: z.string(),
  ease: z.string(),
  occasion: z.string(),
  bodyNotes: z.string(),
  exclusions: z.string(),
  audience: z.string(),
  quantity: z.string(),
});

const RequestSchema = z.object({
  model: z.enum(["deepseek-flash", "deepseek-v4-pro"]),
  workMode: z.enum(["private", "uniform"]),
  confirmedFields: z.array(BriefKeySchema).max(BRIEF_FIELDS.length),
  messages: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        content: z.string().min(1).max(6000),
      }),
    )
    .max(36),
  brief: BriefSchema,
});

const ResponseSchema = z.object({
  reply: z.string(),
  brief: BriefSchema,
  confirmedFields: z.array(BriefKeySchema).max(BRIEF_FIELDS.length).default([]),
  tags: z.array(z.string()).default([]),
  readiness: z.number().min(0).max(100),
  suggestedAnswers: z.array(z.string()).default([]),
});

function systemPrompt() {
  return `你是“海上衣笺”的海派定制业务辅助 Agent，服务于上海服装集团的定制业务专员、职业服方案设计师和高级定制企划人员，辅助其记录客户需求并形成可交接方案。

你的工作：
1. 通过自然、克制的中文对话理解客户想要的服装，保留客户原话中的感性信息。
2. 将口述需求整理成标准定制信息：品类、版型结构、肩型、领型、面料方向、色彩、装饰纹样、长度比例、松弛余量、使用场景、体型与活动需求、明确排除项、使用人群、预估数量。
3. 每次只追问最影响设计的一到两个问题，不要一次抛出长表单。
4. 不报价，不承诺交期，不代替版师定稿，不做用户照片试穿。
5. 不编造公司没有提供的面料、案例或产能。信息不足时明确保留空字段。
6. 语言要像一位有经验但不说套话的定制顾问：具体、平静、短句为主。
7. 对私定场景重点覆盖风格调性、廓形、面料质感、工艺细节、色彩体系、场景适配六类信息；对团体职业服补充团队岗位构成与预估数量。
8. 只有客户明确确认、或客户原话直接给出的事实，才能进入 confirmedFields。任何“建议、倾向、待定、推荐”的内容都只能保留在字段文本中，不能确认。

输出必须是单个 JSON 对象，不能包含 Markdown 代码围栏。格式：
{
  "reply": "给用户的自然语言回复",
  "brief": {
    "category": "",
    "silhouette": "",
    "shoulder": "",
    "collar": "",
    "fabric": "",
    "color": "",
    "pattern": "",
    "length": "",
    "ease": "",
    "occasion": "",
    "bodyNotes": "",
    "exclusions": "",
    "audience": "",
    "quantity": ""
  },
  "confirmedFields": ["category", "occasion"],
  "tags": ["不超过6个标准标签"],
  "readiness": 0,
  "suggestedAnswers": ["最多3个用户可点击的简短回答"]
}

readiness 表示形成可交付设计需求的程度：
- 0-35：只知道场景或风格；
- 36-65：知道品类和大致方向；
- 66-84：关键结构基本明确；
- 85-100：可以进入设计确认。

保留已知字段，只补充用户真正说过的信息或你明确标注为建议的内容。`;
}

function parseJsonContent(content: string): unknown {
  const withoutFence = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object");
  return JSON.parse(withoutFence.slice(start, end + 1));
}

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "对话请求格式不正确" },
      { status: 400 },
    );
  }

  const { messages, brief, model, workMode, confirmedFields } = parsed.data;
  const lastUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content ??
    "";
  const safeBrief = brief || EMPTY_BRIEF;
  const fallback = fallbackAgentReply(
    lastUserMessage,
    safeBrief,
    confirmedFields,
    workMode as WorkMode,
  );
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ...fallback, source: "fallback" });
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(
    /\/$/,
    "",
  );

  try {
    let result: z.infer<typeof ResponseSchema> | null = null;
    for (let attempt = 0; attempt < 2 && !result; attempt += 1) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.35,
          stream: false,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt() },
            ...messages,
            {
              role: "system",
              content: `当前工作模式：${workMode === "private" ? "高端私定" : "团体职业服"}。当前已知定制信息 JSON：${JSON.stringify(safeBrief)}。已确认字段：${JSON.stringify(confirmedFields)}。请在此基础上继续，不要重复已确认内容，不要丢失已有字段，也不要擅自把建议字段标记为已确认。`,
            },
          ],
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!response.ok) throw new Error(`DeepSeek ${response.status}`);
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("DeepSeek returned no content");
      result = ResponseSchema.parse(parseJsonContent(content));
    }
    if (!result) throw new Error("DeepSeek returned no result");

    const mergedBrief = BRIEF_FIELDS.reduce<DesignBrief>(
      (merged, { key }) => {
        merged[key] = result.brief[key]?.trim()
          ? result.brief[key]
          : safeBrief[key];
        return merged;
      },
      { ...safeBrief },
    );
    const mergedConfirmed = sanitizeConfirmedFields(
      [...confirmedFields, ...result.confirmedFields],
      mergedBrief,
    );
    const readiness = Math.min(
      result.readiness,
      readinessFromBrief(mergedBrief, mergedConfirmed, result.tags.length) + 8,
      96,
    );

    return NextResponse.json({
      ...result,
      brief: mergedBrief,
      confirmedFields: mergedConfirmed,
      readiness,
      source: "deepseek",
    });
  } catch {
    return NextResponse.json({
      ...fallback,
      source: "fallback",
      notice: "在线模型暂时未返回结果，已切换为可恢复的本地归纳。",
    });
  }
}
