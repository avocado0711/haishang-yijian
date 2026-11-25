import type {
  BriefKey,
  CatalogProduct,
  CraftAsset,
  DesignBrief,
  FabricChoice,
  KnowledgeAsset,
  PatternSettings,
  PromptVariant,
  RankedProduct,
  ReferenceCase,
  WorkMode,
} from "@/lib/types";

export const EMPTY_BRIEF: DesignBrief = {
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
};

export const BRIEF_FIELDS: Array<{
  key: BriefKey;
  label: string;
}> = [
  { key: "category", label: "品类" },
  { key: "silhouette", label: "版型结构" },
  { key: "shoulder", label: "肩型" },
  { key: "collar", label: "领型" },
  { key: "fabric", label: "面料方向" },
  { key: "color", label: "色彩" },
  { key: "pattern", label: "纹样" },
  { key: "length", label: "长度" },
  { key: "ease", label: "松弛余量" },
  { key: "occasion", label: "使用场景" },
  { key: "bodyNotes", label: "体型与活动" },
  { key: "exclusions", label: "明确排除" },
  { key: "audience", label: "使用人群" },
  { key: "quantity", label: "预估数量" },
];

export const BRIEF_DIMENSIONS: Array<{
  id: string;
  label: string;
  description: string;
  keys: BriefKey[];
}> = [
  {
    id: "context",
    label: "场景与规模",
    description: "穿着任务、使用人群与数量",
    keys: ["category", "occasion", "audience", "quantity"],
  },
  {
    id: "silhouette",
    label: "轮廓与比例",
    description: "整体结构、肩线与衣长",
    keys: ["silhouette", "shoulder", "length"],
  },
  {
    id: "neckline",
    label: "领型与纹样",
    description: "视觉焦点与表面装饰",
    keys: ["collar", "pattern"],
  },
  {
    id: "material",
    label: "面料与色彩",
    description: "材质触感与色彩体系",
    keys: ["fabric", "color"],
  },
  {
    id: "movement",
    label: "活动与体感",
    description: "余量、肩背与活动需求",
    keys: ["ease", "bodyNotes"],
  },
  {
    id: "boundary",
    label: "禁忌与边界",
    description: "明确排除的工艺与装饰",
    keys: ["exclusions"],
  },
];

export const DESIGN_CONFIRMATION_KEYS: BriefKey[] = [
  "silhouette",
  "shoulder",
  "collar",
  "fabric",
  "color",
  "pattern",
  "length",
  "ease",
  "occasion",
];

export const CATALOG: CatalogProduct[] = [
  {
    id: "look-mohua",
    name: "墨花交领外套",
    image: "/assets/catalog/mohua-coat.jpg",
    subtitle: "H 型直身 · 微落平肩 · 真丝暗纹",
    tags: ["新中式", "交领", "H型", "微落肩", "宽松", "正式", "女装"],
    fabric: "真丝暗纹织花",
    craft: "一体式前门襟贴边、暗纹对位",
    silhouette: "衣长至臀中，肩背与袖管放量充足",
    note: "适合正式场合与需要肩背活动余量的身形。",
    family: "outerwear",
    modes: ["private"],
  },
  {
    id: "look-xuanwen",
    name: "玄纹立领外套",
    image: "/assets/catalog/xuanwen-coat.jpg",
    subtitle: "立领 · 单排盘扣 · 海派暗纹",
    tags: ["海派", "立领", "盘扣", "暗纹", "正式", "中性", "见客"],
    fabric: "真丝提花",
    craft: "手工盘扣、门襟暗纹对位",
    silhouette: "直身廓形，肩线利落",
    note: "适合宴会、正式会面与东方极简风格。",
    family: "outerwear",
    modes: ["private"],
  },
  {
    id: "look-silver",
    name: "银灰撞色外套",
    image: "/assets/catalog/silver-contrast-coat.jpg",
    subtitle: "长款 · 撞色袖口 · 系带门襟",
    tags: ["新中式", "撞色", "长款", "女装", "艺术", "社交"],
    fabric: "银灰提花锦",
    craft: "手工系带、撞色滚边",
    silhouette: "宽松长款，袖口外放",
    note: "适合展览、晚宴与更鲜明的个人风格。",
    family: "outerwear",
    modes: ["private"],
  },
  {
    id: "look-xuanse",
    name: "玄色立领衬衫",
    image: "/assets/catalog/xuanse-shirt.jpg",
    subtitle: "轻薄立领 · 暗红滚边 · 日常新中式",
    tags: ["新中式", "立领", "轻薄", "滚边", "日常", "中性", "衬衫"],
    fabric: "香云纱质感提花",
    craft: "细滚边、隐扣门襟",
    silhouette: "宽松直身，适合叠穿",
    note: "适合通勤、旅行和轻正式场合。",
    family: "shirt",
    modes: ["private"],
  },
  {
    id: "look-panel",
    name: "灰黑拼接外套",
    image: "/assets/catalog/panel-jacket.png",
    subtitle: "几何拼接 · 立领 · 轻商务",
    tags: ["新中式", "拼接", "立领", "商务", "男装", "日常", "轻商务"],
    fabric: "几何提花复合面料",
    craft: "不对称拼接、暗门襟",
    silhouette: "轻 H 型，肩胸活动量适中",
    note: "适合轻商务与需要低调识别度的团队着装。",
    family: "outerwear",
    modes: ["private", "uniform"],
  },
  {
    id: "look-uniform",
    name: "海派接待职业服",
    image: "/assets/catalog/panel-jacket.png",
    subtitle: "团体立领 · 可调肩宽 · 抗皱提花",
    tags: ["职业服", "团体", "接待", "立领", "抗皱", "中性", "商务"],
    fabric: "再生纤维与羊毛混纺",
    craft: "分区放量、暗门襟、可调下摆",
    silhouette: "轻 H 型，允许按岗位微调肩宽与衣长",
    note: "适合前台、接待、行政与客户服务团队。",
    family: "uniform",
    modes: ["uniform"],
  },
];

export const FABRICS: FabricChoice[] = [
  {
    id: "fabric-silk",
    name: "真丝暗纹织花",
    composition: "桑蚕丝混织",
    handfeel: "垂感适中，挺而不硬",
    rationale:
      "暗纹低调，适合正式但不张扬的风格；带适度骨感，不会在肩背上软塌，也不会紧贴身体。",
    swatchClass: "swatch--silk",
    tags: ["真丝", "暗纹", "挺括", "垂坠", "正式"],
    modes: ["private"],
    bestFor: "宴会、见客与需要暗纹细节的私定外套",
    caution: "缩率、暗纹对位与坐姿位置需要复核。",
  },
  {
    id: "fabric-satin",
    name: "低光泽丝缎",
    composition: "醋酸与真丝混纺",
    handfeel: "柔滑、垂坠、轻微光泽",
    rationale:
      "适合更轻盈的宴会造型，光泽比传统缎面克制；需要关注袖笼与坐姿位置的面料回弹。",
    swatchClass: "swatch--satin",
    tags: ["丝缎", "柔和", "轻光泽", "宴会", "垂坠"],
    modes: ["private"],
    bestFor: "晚宴、礼服与需要柔和垂坠感的单品",
    caution: "耐磨性和坐姿回弹需要复核。",
  },
  {
    id: "fabric-jacquard",
    name: "几何提花",
    composition: "再生纤维与羊毛混纺",
    handfeel: "有骨架、抗皱、轮廓稳定",
    rationale:
      "适合职业服和每日穿着，易保持肩线与门襟形态；比真丝更日常，但暗纹细腻度稍弱。",
    swatchClass: "swatch--jacquard",
    tags: ["提花", "抗皱", "职业服", "轮廓稳定", "团体"],
    modes: ["private", "uniform"],
    bestFor: "职业服、轻商务和需要稳定轮廓的日常外套",
    caution: "需复核批次色差、缩率与补货一致性。",
  },
  {
    id: "fabric-wool",
    name: "精纺羊毛混纺",
    composition: "羊毛与弹性纤维混纺",
    handfeel: "哑光、垂而不塌、骨感克制",
    rationale:
      "适合正式见客与需要肩背活动量的外套；表面哑光，不反光，立领和门襟更容易保持形态。",
    swatchClass: "swatch--wool",
    tags: ["羊毛", "精纺", "哑光", "正式", "见客", "抗皱"],
    modes: ["private", "uniform"],
    bestFor: "见客、轻商务和需要耐穿性的团体外套",
    caution: "需确认克重、起球等级与肩部压烫方式。",
  },
];

export const CRAFTS: CraftAsset[] = [
  {
    id: "craft-soft-shoulder",
    name: "无反衬自然肩",
    category: "structure",
    tags: ["自然肩", "无结构", "松弛"],
    description: "以薄肩线维持轮廓，抬手不顶，适合正式但不板正的外套。",
    caution: "衣长较长时需复核肩头是否塌落。",
  },
  {
    id: "craft-low-stand-collar",
    name: "三厘米低立领",
    category: "structure",
    tags: ["立领", "低立领", "正式"],
    description: "扣合后不勒喉、低头不硌下巴，以同色滚边收口。",
    caution: "需通过试身确认颈部活动与领口回弹。",
  },
  {
    id: "craft-hidden-placket",
    name: "隐扣门襟",
    category: "finish",
    tags: ["门襟", "低调", "简洁"],
    description: "隐藏扣合结构，保留正面纵向线条，减少装饰感。",
    caution: "门襟平整度与暗纹对位需要在样衣上复核。",
  },
  {
    id: "craft-tonal-piping",
    name: "同色细滚边",
    category: "detail",
    tags: ["滚边", "简洁", "同色"],
    description: "用同色或低对比滚边收住领口和门襟，不依赖刺绣制造细节。",
    caution: "窄滚边对车缝稳定性要求较高。",
  },
  {
    id: "craft-panel-adjustment",
    name: "岗位分区放量",
    category: "structure",
    tags: ["职业服", "团体", "活动量"],
    description: "按前台、接待和行政岗位的活动差异调整肩宽、袖笼及下摆。",
    caution: "需要先确定岗位比例，再进入尺码分配。",
  },
];

export const REFERENCE_CASES: ReferenceCase[] = [
  {
    id: "case-private-meeting",
    name: "私定 · 见客低立领外套",
    mode: "private",
    scenario: "正式见客，肩背较宽，希望体面但不板正。",
    outcome: "自然肩、低立领、精纺羊毛与隐扣门襟形成可交接方案。",
    assetIds: ["look-xuanwen", "fabric-wool", "craft-soft-shoulder"],
  },
  {
    id: "case-uniform-reception",
    name: "团体 · 前台与接待职业服",
    mode: "uniform",
    scenario: "18 人前台与接待团队，需要东方气质、抗皱和岗位适配。",
    outcome: "轻 H 型立领外套、几何提花与岗位分区放量形成团队方案。",
    assetIds: ["look-uniform", "fabric-jacquard", "craft-panel-adjustment"],
  },
];

export interface DemoCase {
  id: string;
  label: string;
  summary: string;
  workMode: WorkMode;
  brief: DesignBrief;
  confirmedFields: BriefKey[];
  tags: string[];
}

const ALL_BRIEF_KEYS = BRIEF_FIELDS.map((field) => field.key);

export const DEMO_CASES: DemoCase[] = [
  {
    id: "private-meeting",
    label: "私定演示：见客外套",
    summary: "正式但不拘束，低立领与自然肩。",
    workMode: "private",
    brief: {
      category: "外套（新中式）",
      silhouette: "直身宽松，肩背与袖笼保留活动量",
      shoulder: "无结构自然肩，薄肩线支撑",
      collar: "低立领约 3cm，同色细滚边",
      fabric: "精纺羊毛混纺，哑光有骨感",
      color: "低饱和墨色",
      pattern: "同色暗纹，不使用对比刺绣",
      length: "盖过胯骨，下摆直落",
      ease: "宽松但不板正，抬手不紧绷",
      occasion: "见客谈事",
      bodyNotes: "肩背较宽，需要避免压肩和卡手臂",
      exclusions: "不用厚垫肩，不加水钻或亮片",
      audience: "单人私定",
      quantity: "1 件",
    },
    confirmedFields: ALL_BRIEF_KEYS,
    tags: ["新中式", "低立领", "自然肩", "精纺羊毛", "见客"],
  },
  {
    id: "uniform-reception",
    label: "职业服演示：接待团队",
    summary: "18 人前台与接待团队，低调东方气质。",
    workMode: "uniform",
    brief: {
      category: "团体职业服外套",
      silhouette: "轻 H 型，肩胸活动量适中",
      shoulder: "薄肩棉，保持肩头但不硬挺",
      collar: "低立领，同色滚边",
      fabric: "再生纤维与羊毛混纺，抗皱提花",
      color: "深灰配藏青滚边",
      pattern: "低调几何提花",
      length: "臀中长度，便于日常活动",
      ease: "坐姿和抬臂不紧绷",
      occasion: "客户接待与日常通勤",
      bodyNotes: "前台、接待与行政岗位，男女同款分版",
      exclusions: "不使用高亮反光面料，不添加醒目品牌标识",
      audience: "前台与接待团队",
      quantity: "18 件",
    },
    confirmedFields: ALL_BRIEF_KEYS,
    tags: ["职业服", "团体", "接待", "抗皱", "东方气质"],
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

export const isUncertainValue = (value: string) =>
  /待定|待确认|建议|可能|倾向|候选/.test(value);

export function sanitizeConfirmedFields(
  values: unknown,
  brief: DesignBrief,
): BriefKey[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values.filter(
        (value): value is BriefKey =>
          typeof value === "string" &&
          ALL_BRIEF_KEYS.includes(value as BriefKey) &&
          Boolean(brief[value as BriefKey]?.trim()) &&
          !isUncertainValue(brief[value as BriefKey]),
      ),
    ),
  );
}

export function designGateStatus(
  brief: DesignBrief,
  confirmedFields: BriefKey[],
) {
  const confirmed = sanitizeConfirmedFields(confirmedFields, brief);
  const categoryConfirmed = confirmed.includes("category");
  const designConfirmed = DESIGN_CONFIRMATION_KEYS.filter((key) =>
    confirmed.includes(key),
  ).length;
  return {
    categoryConfirmed,
    designConfirmed,
    missingDesignCount: Math.max(0, 3 - designConfirmed),
    ready: categoryConfirmed && designConfirmed >= 3,
  };
}

export function readinessFromBrief(
  brief: DesignBrief,
  confirmedFields: BriefKey[],
  tagCount = 0,
) {
  const confirmed = sanitizeConfirmedFields(confirmedFields, brief).length;
  if (confirmed === 0) return 8;
  return Math.min(96, 8 + confirmed * 6 + Math.min(tagCount, 6) * 2);
}

export function briefTerms(brief: DesignBrief): string[] {
  return Object.values(brief)
    .flatMap((value) => value.split(/[，,、;；/\s]+/))
    .map(normalize)
    .filter(Boolean);
}

export function detectCategoryFamily(
  category: string,
): CatalogProduct["family"] | null {
  if (/职业服|团服|工装/.test(category)) return "uniform";
  if (/衬衫|衬衣/.test(category)) return "shirt";
  if (/旗袍|礼服|裙/.test(category)) return "dress";
  if (/外套|夹克|西装|上衣|大衣/.test(category)) return "outerwear";
  return null;
}

function briefText(brief: DesignBrief, confirmedFields: BriefKey[]) {
  return confirmedFields.map((key) => brief[key]).filter(Boolean).join(" ").toLowerCase();
}

export function rankProducts(
  brief: DesignBrief,
  confirmedFields: BriefKey[],
  workMode: WorkMode,
  limit = 3,
): RankedProduct[] {
  const family = detectCategoryFamily(brief.category);
  const text = briefText(brief, confirmedFields);
  const candidates = CATALOG.filter((product) => product.modes.includes(workMode));
  if (!family) return [];
  const pool = candidates.filter((product) => product.family === family);
  if (pool.length === 0) return [];

  return pool
    .map((product) => {
      const matchedTags = product.tags.filter((tag) =>
        text.includes(tag.toLowerCase()),
      );
      const occasionBoost = /见客|正式|商务|接待|职业服/.test(text)
        ? product.tags.some((tag) => /正式|商务|接待|职业服|见客/.test(tag))
          ? 8
          : 0
        : 0;
      const fabricBoost =
        brief.fabric &&
        product.fabric
          .toLowerCase()
          .split(/[、，,\s]+/)
          .some((part) => part && text.includes(part))
          ? 5
          : 0;
      const familyBoost =
        family && product.family === family ? 40 : family ? 6 : 18;
      const modeBoost = product.modes.includes(workMode) ? 12 : 0;
      const score = Math.max(
        0,
        Math.min(
          98,
          20 +
            familyBoost +
            modeBoost +
            matchedTags.length * 6 +
            occasionBoost +
            fabricBoost,
        ),
      );
      const gaps: string[] = [];
      if (family && product.family !== family) {
        gaps.push("所属品类不同，不能直接作为当前基线");
      }
      if (
        brief.collar &&
        !product.tags.some((tag) => text.includes(tag.toLowerCase()))
      ) {
        gaps.push("领型需在版型阶段重设");
      }
      if (brief.fabric && !text.includes(product.fabric)) {
        gaps.push("现有面料需重新匹配");
      }
      const reason =
        matchedTags.length > 0
          ? `匹配 ${matchedTags.slice(0, 4).join("、")}，保留 ${product.craft}`
          : "品类与工作模式匹配，需按当前需求重设领型、面料与工艺";

      return { ...product, score, reason, matchedTags, gaps };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function pickFabric(
  brief: DesignBrief,
  confirmedFields: BriefKey[],
  product: CatalogProduct | undefined,
  workMode: WorkMode,
) {
  const text = briefText(brief, confirmedFields);
  return FABRICS.filter((fabric) => fabric.modes.includes(workMode))
    .map((fabric, index) => {
      const tagScore = fabric.tags.filter((tag) =>
        text.includes(tag.toLowerCase()),
      ).length;
      const productScore = product?.fabric === fabric.name ? 8 : 0;
      return {
        fabric,
        score: (index === 0 ? 1 : 0) + tagScore * 5 + productScore,
      };
    })
    .sort((a, b) => b.score - a.score)[0]?.fabric;
}

export function derivePattern(
  brief: DesignBrief,
  confirmedFields: BriefKey[],
  product: CatalogProduct | undefined,
): PatternSettings {
  const text = briefText(brief, confirmedFields);
  const collarForm = /无领/.test(text)
    ? "无领"
    : /立领/.test(text)
      ? "立领"
      : /交领/.test(text)
        ? "交领开敞"
        : product?.tags.includes("立领")
          ? "立领"
          : product?.tags.includes("交领")
            ? "交领开敞"
            : "立领";
  const length = /髋上|胯骨以上|短款|利落/.test(text)
    ? "髋上"
    : /膝上|长款/.test(text)
      ? "膝上"
      : "臀中";
  const uniform = product?.family === "uniform";
  const relaxed = /宽松|松弛|不板正|活动|不紧绷/.test(text);

  return {
    shoulderDrop: uniform ? 2 : /自然肩|无结构/.test(text) ? 4 : 3,
    armholeEase: uniform ? 10 : relaxed ? 10 : 8,
    bodyEase: uniform ? 14 : relaxed ? 14 : 12,
    length,
    collarForm,
  };
}

export function deriveSampleChecks(
  pattern: PatternSettings,
  fabric: FabricChoice,
  product: CatalogProduct | undefined,
) {
  const checks = [
    "肩位不压肩，抬手不顶",
    "袖笼抬手无明显紧绷",
    pattern.collarForm === "立领"
      ? "低立领扣合后不勒喉、低头不硌"
      : pattern.collarForm === "交领开敞"
        ? "交领开口平顺，不向外翻"
        : "无领口沿平顺贴合",
    `衣长落在${pattern.length}标记位`,
    fabric.tags.includes("提花") || fabric.tags.includes("暗纹")
      ? "暗纹与门襟对位正常"
      : "面料表面无异常压痕或反光",
    "前门襟平整，扣合后无拉扯",
  ];
  if (product?.family === "uniform") {
    checks.push("岗位尺码分布与实际活动量一致");
  }
  return checks;
}

export function buildKnowledgeAssets(): KnowledgeAsset[] {
  const patterns: KnowledgeAsset[] = CATALOG.map((product) => ({
    id: `pattern-${product.id}`,
    tab: "pattern",
    name: product.name,
    meta: `${product.family} · ${product.silhouette}`,
    description: `${product.craft}。${product.note}`,
    tags: product.tags,
  }));
  const fabrics: KnowledgeAsset[] = FABRICS.map((fabric) => ({
    id: `fabric-${fabric.id}`,
    tab: "fabric",
    name: fabric.name,
    meta: fabric.composition,
    description: `${fabric.rationale} ${fabric.caution}`,
    tags: fabric.tags,
  }));
  const crafts: KnowledgeAsset[] = CRAFTS.map((craft) => ({
    id: `craft-${craft.id}`,
    tab: "craft",
    name: craft.name,
    meta: craft.category,
    description: `${craft.description} ${craft.caution}`,
    tags: craft.tags,
  }));
  const cases: KnowledgeAsset[] = REFERENCE_CASES.map((item) => ({
    id: `case-${item.id}`,
    tab: "case",
    name: item.name,
    meta: item.mode === "private" ? "高端私定" : "团体职业服",
    description: `${item.scenario} ${item.outcome}`,
    tags: [item.mode === "private" ? "私定" : "职业服", ...item.assetIds],
  }));
  return [...patterns, ...fabrics, ...crafts, ...cases];
}

export function knowledgeCounts() {
  return {
    pattern: CATALOG.length,
    fabric: FABRICS.length,
    craft: CRAFTS.length,
    case: REFERENCE_CASES.length,
  };
}

export interface DesignPromptInput {
  brief: DesignBrief;
  confirmedFields: BriefKey[];
  workMode: WorkMode;
  productName?: string;
  fabricName?: string;
}

function promptValue(value: string) {
  return value
    .replace(/^(待定|待确认|建议方向|建议|方案建议)\s*[：:]\s*/g, "")
    .replace(/[（(]\s*待确认\s*[）)]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildDesignPrompts({
  brief,
  confirmedFields,
  workMode,
  productName,
  fabricName,
}: DesignPromptInput): PromptVariant[] {
  const confirmed = new Set(confirmedFields);
  const value = (key: BriefKey) =>
    confirmed.has(key) && !isUncertainValue(brief[key])
      ? promptValue(brief[key])
      : "";
  const confirmedLines = BRIEF_FIELDS.filter(
    (field) => value(field.key).length > 0,
  ).map((field) => `${field.label}: ${value(field.key)}.`);
  const commonLines = [
    "Use only the confirmed requirements listed below. Do not invent missing colors, materials, collar shapes, decorative motifs, body claims, or styling props.",
    `Business mode: ${workMode === "private" ? "private bespoke" : "corporate uniform program"}.`,
    ...(confirmedLines.length > 0
      ? confirmedLines
      : ["Confirmed requirements: none supplied."]),
    productName
      ? `Enterprise baseline reference only: ${promptValue(productName)}. This is not a confirmed client requirement.`
      : "",
    fabricName
      ? `Enterprise fabric candidate only: ${promptValue(fabricName)}. Keep it separate from confirmed fabric direction.`
      : "",
    "No logo, no text, no watermark, no runway scene, no fantasy costume styling, and no decorative motif that was not explicitly confirmed.",
  ];

  return [
    {
      id: "garment",
      label: "成衣效果",
      purpose: "整体比例、正面与背面结构",
      prompt: [
        "Create a production-oriented concept sheet for a Shanghai-style made-to-measure garment.",
        ...commonLines,
        "Show one full front view and one back view on an invisible mannequin or clean technical form.",
        "Keep seams, proportions, garment length, collar construction, and fabric behavior visually consistent between views.",
        "Precise garment construction, soft atelier lighting, neutral warm-gray background.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      id: "craft",
      label: "工艺细节",
      purpose: "领口、肩缝、门襟与面料近景",
      prompt: [
        "Create a macro craft-detail board for a Shanghai-style made-to-measure garment.",
        ...commonLines,
        "Use a three-panel close-up composition: collar and neckline transition, shoulder and armhole seam, front placket and fabric surface.",
        "Show stitching, edge finishing, grain direction, and material texture only where supported by the confirmed requirements.",
        "Museum-quality garment photography, raking soft light, neutral workroom surface.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      id: "styling",
      label: "上身穿搭",
      purpose: "场景氛围与整体造型",
      prompt: [
        "Create an editorial on-body styling preview for a Shanghai-style made-to-measure garment.",
        ...commonLines,
        "Show one anonymous adult model in a calm full-length pose that reveals the silhouette, garment length, ease, and collar shape.",
        "The environment should suggest the confirmed use scenario without adding narrative props, logos, or unconfirmed cultural symbols.",
        "Restrained luxury styling, natural fabric drape, soft directional daylight, quiet architectural interior.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function buildDesignPrompt(input: DesignPromptInput): string {
  return buildDesignPrompts(input)[0].prompt;
}

const FALLBACK_QUESTIONS: Array<{
  key: BriefKey;
  question: string;
  suggestion: string;
}> = [
  {
    key: "category",
    question: "先确认这件衣服属于外套、衬衫，还是团体职业服？",
    suggestion: "先按外套方向整理",
  },
  {
    key: "occasion",
    question: "它主要在什么场合穿？",
    suggestion: "见客谈事，需要体面",
  },
  {
    key: "silhouette",
    question: "轮廓希望利落一些，还是更宽松松弛？",
    suggestion: "宽松但不板正",
  },
  {
    key: "shoulder",
    question: "肩线希望自然柔软，还是保留一点结构？",
    suggestion: "无结构自然肩",
  },
  {
    key: "collar",
    question: "领口更偏向低立领、交领，还是无领？",
    suggestion: "低立领，扣上不勒",
  },
  {
    key: "fabric",
    question: "面料更看重哑光垂感、抗皱耐穿，还是轻盈光泽？",
    suggestion: "精纺羊毛，哑光有骨感",
  },
  {
    key: "color",
    question: "色彩希望低调耐看，还是更有对比？",
    suggestion: "低饱和墨色或藏青",
  },
  {
    key: "length",
    question: "衣长希望到髋上、臀中，还是更长？",
    suggestion: "长度盖过胯骨",
  },
];

export function fallbackAgentReply(
  text: string,
  brief: DesignBrief,
  confirmedFields: BriefKey[] = [],
  workMode: WorkMode = "private",
): {
  reply: string;
  brief: DesignBrief;
  confirmedFields: BriefKey[];
  tags: string[];
  readiness: number;
  suggestedAnswers: string[];
} {
  const next = { ...brief };
  const confirmed = new Set(confirmedFields);
  const tags = new Set<string>();
  const confirm = (key: BriefKey, value: string) => {
    if (!value.trim()) return;
    next[key] = value;
    confirmed.add(key);
  };

  if (/职业服|团服|工装|公司制服/.test(text)) {
    confirm("category", "团体职业服外套");
    confirm("audience", "企业团队");
    tags.add("职业服");
  } else if (/旗袍/.test(text)) {
    confirm("category", "现代海派旗袍");
    tags.add("旗袍");
  } else if (/礼服|裙装|连衣裙/.test(text)) {
    confirm("category", "礼服裙装");
  } else if (/外套|夹克|西装|大衣|上衣/.test(text)) {
    confirm("category", "外套");
  }
  if (/新中式|海派|东方气质/.test(text)) {
    tags.add(/海派/.test(text) ? "海派" : "新中式");
  }
  if (/见客|谈事|会面/.test(text)) {
    confirm("occasion", "见客谈事");
    tags.add("见客");
  } else if (/婚礼|宴请|宴会/.test(text)) {
    confirm("occasion", "婚礼或宴请");
    tags.add("正式");
  } else if (/通勤|日常/.test(text)) {
    confirm("occasion", "通勤日常");
  } else if (/接待|客户服务/.test(text)) {
    confirm("occasion", "客户接待");
    tags.add("接待");
  } else if (/正式/.test(text)) {
    confirm("occasion", "正式场合");
    tags.add("正式");
  }
  if (/自然肩|无结构|几乎无结构/.test(text)) {
    confirm("shoulder", "无结构自然肩，薄肩线支撑");
    tags.add("自然肩");
  } else if (/薄肩棉|一点结构|肩头不塌/.test(text)) {
    confirm("shoulder", "薄肩棉支撑，肩头不塌");
  }
  if (/低立领|立领/.test(text)) {
    confirm("collar", "低立领，同色细滚边");
    tags.add("立领");
  } else if (/交领/.test(text)) {
    confirm("collar", "交领开敞");
  } else if (/无领/.test(text)) {
    confirm("collar", "无领配窄滚边");
  }
  if (/精纺羊毛|羊毛混纺|羊毛/.test(text)) {
    confirm("fabric", "精纺羊毛混纺，哑光有骨感");
    tags.add("精纺羊毛");
  } else if (/抗皱|提花/.test(text)) {
    confirm("fabric", "抗皱提花面料");
  } else if (/真丝|香云纱/.test(text)) {
    confirm("fabric", "真丝或香云纱质感面料");
  }
  if (/低饱和|低调|墨色|藏青|深灰/.test(text)) {
    const color = /藏青/.test(text)
      ? "低饱和藏青"
      : /深灰/.test(text)
        ? "深灰配少量同色层次"
        : "低饱和墨色或藏青";
    confirm("color", color);
    tags.add("低饱和");
  }
  if (/暗纹|同色纹/.test(text)) confirm("pattern", "同色暗纹");
  if (/几何提花|几何纹/.test(text)) confirm("pattern", "低调几何提花");
  if (/盖过胯骨|臀中|盖胯/.test(text)) {
    confirm("length", "盖过胯骨，下摆直落");
  } else if (/髋上|胯骨以上|短一点|利落/.test(text)) {
    confirm("length", "髋上长度，轮廓利落");
  } else if (/膝上|长款/.test(text)) {
    confirm("length", "膝上长度");
  }
  if (/宽松|松弛|不板正|不束缚/.test(text)) {
    confirm("ease", "宽松但不板正，抬手不紧绷");
    tags.add("松弛体面");
  }
  if (/肩宽|肩背宽|厚背|不压肩|不卡手臂/.test(text)) {
    confirm("bodyNotes", "肩背较宽，需要避免压肩和卡手臂");
  }
  if (/不要亮片|不亮片/.test(text)) {
    confirm("exclusions", "不使用亮片、水钻或高反光装饰");
  } else if (/不要刺绣/.test(text)) {
    confirm("exclusions", "不使用对比刺绣");
  } else if (/不要板正|不要制服感|不用厚垫肩/.test(text)) {
    confirm("exclusions", "不用厚垫肩，避免制服感");
  }
  if (workMode === "uniform" && !next.audience) {
    confirm("audience", "企业团队");
  }
  const quantityMatch = text.match(/(\d+)\s*(件|人|套)/);
  if (quantityMatch) confirm("quantity", `${quantityMatch[1]} ${quantityMatch[2]}`);

  if (!next.silhouette && /外套|职业服/.test(next.category)) {
    next.silhouette =
      workMode === "uniform"
        ? "轻 H 型，肩胸活动量适中"
        : "直身宽松，肩背与袖笼保留活动量";
  }

  const cleanConfirmed = sanitizeConfirmedFields(Array.from(confirmed), next);
  const missing = FALLBACK_QUESTIONS.find(
    (item) => !cleanConfirmed.includes(item.key),
  );
  const suggestions = missing
    ? [missing.suggestion]
    : !cleanConfirmed.includes("pattern")
      ? ["纹样克制，用同色暗纹"]
      : [];
  const reply = missing
    ? `已记录你刚才确认的内容。${missing.question}`
    : `目前已形成可进入设计确认的需求：${next.category || "定制单品"}，${next.occasion || "正式场景"}，${next.collar || "领型待定"}。下一步可以匹配企业版型与面料。`;

  return {
    reply,
    brief: next,
    confirmedFields: cleanConfirmed,
    tags: Array.from(tags),
    readiness: readinessFromBrief(next, cleanConfirmed, tags.size),
    suggestedAnswers: suggestions,
  };
}
