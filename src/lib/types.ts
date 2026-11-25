export type StageId =
  | "brief"
  | "design"
  | "fabric"
  | "pattern"
  | "sample"
  | "delivery";

export type LlmModel = "deepseek-flash" | "deepseek-v4-pro";
export type ImageQuality = "fast" | "balanced" | "quality";
export type WorkMode = "private" | "uniform";
export type AssetTab = "pattern" | "fabric" | "craft" | "case";
export type PromptVariantId = "garment" | "craft" | "styling";

export interface DesignBrief {
  category: string;
  silhouette: string;
  shoulder: string;
  collar: string;
  fabric: string;
  color: string;
  pattern: string;
  length: string;
  ease: string;
  occasion: string;
  bodyNotes: string;
  exclusions: string;
  audience: string;
  quantity: string;
}

export type BriefKey = keyof DesignBrief;

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

export interface AgentResponse {
  reply: string;
  brief: DesignBrief;
  confirmedFields: BriefKey[];
  tags: string[];
  readiness: number;
  suggestedAnswers: string[];
  source: "deepseek" | "fallback";
}

export interface CatalogProduct {
  id: string;
  name: string;
  image: string;
  subtitle: string;
  tags: string[];
  fabric: string;
  craft: string;
  silhouette: string;
  note: string;
  family: "outerwear" | "shirt" | "dress" | "uniform";
  modes: WorkMode[];
}

export interface RankedProduct extends CatalogProduct {
  score: number;
  reason: string;
  matchedTags: string[];
  gaps: string[];
}

export interface FabricChoice {
  id: string;
  name: string;
  composition: string;
  handfeel: string;
  rationale: string;
  swatchClass: string;
  tags: string[];
  modes: WorkMode[];
  bestFor: string;
  caution: string;
}

export interface CraftAsset {
  id: string;
  name: string;
  category: "structure" | "finish" | "detail";
  tags: string[];
  description: string;
  caution: string;
}

export interface ReferenceCase {
  id: string;
  name: string;
  mode: WorkMode;
  scenario: string;
  outcome: string;
  assetIds: string[];
}

export type KnowledgeAsset =
  | {
      id: string;
      tab: "pattern";
      name: string;
      meta: string;
      description: string;
      tags: string[];
    }
  | {
      id: string;
      tab: "fabric";
      name: string;
      meta: string;
      description: string;
      tags: string[];
    }
  | {
      id: string;
      tab: "craft";
      name: string;
      meta: string;
      description: string;
      tags: string[];
    }
  | {
      id: string;
      tab: "case";
      name: string;
      meta: string;
      description: string;
      tags: string[];
    };

export interface TimelineEvent {
  at: string;
  action: string;
  detail: string;
}

export interface DesignResult {
  imageUrl: string;
  visualKind: "effect" | "pattern";
  prompt: string;
  prompts: PromptVariant[];
  generated: boolean;
  imageModelLabel: string;
  note: string;
}

export interface PromptVariant {
  id: PromptVariantId;
  label: string;
  purpose: string;
  prompt: string;
}

export interface PatternSettings {
  shoulderDrop: number;
  armholeEase: number;
  bodyEase: number;
  length: string;
  collarForm: string;
}

export interface HandoffPackage {
  schemaVersion: "haishang-yijian/ledger/v1";
  project: {
    name: string;
    workMode: WorkMode;
    generatedAt: string;
  };
  brief: DesignBrief;
  confirmedFields: BriefKey[];
  aestheticTags: string[];
  ledgerNotes: string;
  pendingFields: Array<{ key: BriefKey; label: string; value: string }>;
  selectedProduct: CatalogProduct;
  selectedFabric: FabricChoice;
  crafts: CraftAsset[];
  pattern: PatternSettings;
  sampleChecks: string[];
  proposal: {
    stylePositioning: string;
    silhouette: string;
    fabric: string;
    collarLength: string;
    crafts: string;
    occasion: string;
    highlights: string;
  };
  design: {
    imageUrl: string;
    generated: boolean;
    imageModelLabel: string;
    prompt: string;
    prompts: PromptVariant[];
  };
  resourceMatches: Array<{
    id: string;
    name: string;
    score: number;
    reason: string;
    gaps: string[];
  }>;
  timeline: TimelineEvent[];
  boundary: string;
}

export interface HandoffPayload {
  package: HandoffPackage;
  contact: {
    name: string;
    phone: string;
    city: string;
    preferredTime: string;
    note: string;
  };
}

export interface RuntimeConfig {
  llmConfigured: boolean;
  imageApiConfigured: boolean;
  defaultLlmModel: LlmModel;
}
