import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { BRIEF_FIELDS, buildDesignPrompts } from "@/lib/brief";
import type { BriefKey, WorkMode } from "@/lib/types";

const BriefKeySchema = z.enum(
  BRIEF_FIELDS.map((field) => field.key) as [BriefKey, ...BriefKey[]],
);

const RequestSchema = z.object({
  brief: z.object({
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
  }),
  confirmedFields: z.array(BriefKeySchema).max(BRIEF_FIELDS.length).default([]),
  workMode: z.enum(["private", "uniform"]).default("private"),
  productName: z.string().max(120).optional(),
  fabricName: z.string().max(120).optional(),
  imageQuality: z.enum(["fast", "balanced", "quality"]),
});

const qualityLabels = {
  fast: "极速草图",
  balanced: "均衡设计",
  quality: "精细渲染",
} as const;

const modelEnvByQuality = {
  fast: "IMAGE_MODEL_FAST",
  balanced: "IMAGE_MODEL_BALANCED",
  quality: "IMAGE_MODEL_QUALITY",
} as const;

function imageEndpoint(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, "");
  return normalized.endsWith("/images/generations")
    ? normalized
    : `${normalized}/images/generations`;
}

function fallbackResponse(
  brief: z.infer<typeof RequestSchema>["brief"],
  confirmedFields: BriefKey[],
  workMode: WorkMode,
  productName: string | undefined,
  fabricName: string | undefined,
  imageQuality: keyof typeof qualityLabels,
  note: string,
) {
  const prompts = buildDesignPrompts({
    brief,
    confirmedFields,
    workMode,
    productName,
    fabricName,
  });
  const prompt = prompts[0].prompt;

  return NextResponse.json({
    imageUrl: "/assets/process/design-effect.png",
    visualKind: "effect",
    prompt,
    prompts,
    generated: false,
    imageModelLabel: qualityLabels[imageQuality],
    note,
  });
}

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "设计请求格式不正确" },
      { status: 400 },
    );
  }

  const {
    brief,
    confirmedFields,
    workMode,
    productName,
    fabricName,
    imageQuality,
  } = parsed.data;
  const prompts = buildDesignPrompts({
    brief,
    confirmedFields,
    workMode: workMode as WorkMode,
    productName,
    fabricName,
  });
  const prompt = prompts[0].prompt;
  const apiKey = process.env.IMAGE_API_KEY;
  const baseUrl = process.env.IMAGE_API_BASE_URL;

  if (!apiKey || !baseUrl) {
    return fallbackResponse(
      brief,
      confirmedFields,
      workMode,
      productName,
      fabricName,
      imageQuality,
      "当前使用企业静态设计资产。配置图像服务地址后，可按所选模型生成实时方案。",
    );
  }

  const model =
    process.env[modelEnvByQuality[imageQuality]] ||
    (imageQuality === "fast"
      ? "flux-schnell"
      : imageQuality === "balanced"
        ? "seedream-4"
        : "gpt-image-1");

  try {
    const response = await fetch(imageEndpoint(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: "1024x1536",
        response_format: "url",
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) throw new Error(`Image provider ${response.status}`);
    const result = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const image = result.data?.[0];

    if (image?.url) {
      return NextResponse.json({
        imageUrl: image.url,
        visualKind: "effect",
        prompt,
        prompts,
        generated: true,
        imageModelLabel: qualityLabels[imageQuality],
        note: `由 ${model} 实时生成`,
      });
    }

    if (image?.b64_json) {
      const generatedDir = path.join(process.cwd(), "public", "generated");
      await mkdir(generatedDir, { recursive: true });
      const filename = `${randomUUID()}.png`;
      await writeFile(
        path.join(generatedDir, filename),
        Buffer.from(image.b64_json, "base64"),
      );
      return NextResponse.json({
        imageUrl: `/generated/${filename}`,
        visualKind: "effect",
        prompt,
        prompts,
        generated: true,
        imageModelLabel: qualityLabels[imageQuality],
        note: `由 ${model} 实时生成`,
      });
    }

    throw new Error("Image provider returned no image");
  } catch {
    return fallbackResponse(
      brief,
      confirmedFields,
      workMode,
      productName,
      fabricName,
      imageQuality,
      "图像服务暂时未返回结果，已切换到本地设计资产。",
    );
  }
}
