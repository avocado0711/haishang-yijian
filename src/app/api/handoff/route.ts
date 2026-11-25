import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

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

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  subtitle: z.string(),
  tags: z.array(z.string()),
  fabric: z.string(),
  craft: z.string(),
  silhouette: z.string(),
  note: z.string(),
  family: z.enum(["outerwear", "shirt", "dress", "uniform"]),
  modes: z.array(z.enum(["private", "uniform"])),
});

const FabricSchema = z.object({
  id: z.string(),
  name: z.string(),
  composition: z.string(),
  handfeel: z.string(),
  rationale: z.string(),
  swatchClass: z.string(),
  tags: z.array(z.string()),
  modes: z.array(z.enum(["private", "uniform"])),
  bestFor: z.string(),
  caution: z.string(),
});

const CraftSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["structure", "finish", "detail"]),
  tags: z.array(z.string()),
  description: z.string(),
  caution: z.string(),
});

const PromptVariantSchema = z.object({
  id: z.enum(["garment", "craft", "styling"]),
  label: z.string(),
  purpose: z.string(),
  prompt: z.string(),
});

const LedgerPackageSchema = z.object({
  schemaVersion: z.literal("haishang-yijian/ledger/v1"),
  project: z.object({
    name: z.string(),
    workMode: z.enum(["private", "uniform"]),
    generatedAt: z.string(),
  }),
  brief: BriefSchema,
  confirmedFields: z.array(z.string()),
  aestheticTags: z.array(z.string()),
  ledgerNotes: z.string().max(2800),
  pendingFields: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      value: z.string(),
    }),
  ),
  selectedProduct: ProductSchema,
  selectedFabric: FabricSchema,
  crafts: z.array(CraftSchema),
  pattern: z.object({
    shoulderDrop: z.number(),
    armholeEase: z.number(),
    bodyEase: z.number(),
    length: z.string(),
    collarForm: z.string(),
  }),
  sampleChecks: z.array(z.string()),
  proposal: z.object({
    stylePositioning: z.string(),
    silhouette: z.string(),
    fabric: z.string(),
    collarLength: z.string(),
    crafts: z.string(),
    occasion: z.string(),
    highlights: z.string(),
  }),
  design: z.object({
    imageUrl: z.string(),
    generated: z.boolean(),
    imageModelLabel: z.string(),
    prompt: z.string(),
    prompts: z.array(PromptVariantSchema).length(3),
  }),
  resourceMatches: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      score: z.number(),
      reason: z.string(),
      gaps: z.array(z.string()),
    }),
  ),
  timeline: z.array(
    z.object({
      at: z.string(),
      action: z.string(),
      detail: z.string(),
    }),
  ),
  boundary: z.string(),
});

const RequestSchema = z.object({
  package: LedgerPackageSchema,
  contact: z.object({
    name: z.string().min(2).max(40),
    phone: z.string().min(6).max(30),
    city: z.string().min(1).max(40),
    preferredTime: z.string().min(1).max(80),
    note: z.string().max(500),
  }),
});

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "请检查联系信息后再提交" },
      { status: 400 },
    );
  }

  const id = `HY-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const handoffDir = path.join(process.cwd(), "data", "handoffs");
  await mkdir(handoffDir, { recursive: true });
  await writeFile(
    path.join(handoffDir, `${id}.json`),
    JSON.stringify(
      {
        id,
        submittedAt: new Date().toISOString(),
        contact: parsed.data.contact,
        package: parsed.data.package,
        status: "pending_consultant_review",
      },
      null,
      2,
    ),
    "utf8",
  );

  return NextResponse.json({
    ok: true,
    id,
    message: "完整方案台账已生成，顾问可在业务接入后继续复核。",
  });
}
