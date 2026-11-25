"use client";

/* eslint-disable @next/next/no-img-element */

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  FileDown,
  FileText,
  Layers,
  LibraryBig,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Package,
  PenLine,
  Printer,
  RefreshCw,
  Ruler,
  Search,
  Scissors,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import {
  BRIEF_DIMENSIONS,
  BRIEF_FIELDS,
  CATALOG,
  CRAFTS,
  DEMO_CASES,
  EMPTY_BRIEF,
  FABRICS,
  buildDesignPrompts,
  buildKnowledgeAssets,
  derivePattern,
  deriveSampleChecks,
  designGateStatus,
  fallbackAgentReply,
  isUncertainValue,
  knowledgeCounts,
  pickFabric,
  rankProducts,
  readinessFromBrief,
  sanitizeConfirmedFields,
} from "@/lib/brief";
import type {
  AgentResponse,
  AssetTab,
  BriefKey,
  ChatMessage,
  DesignBrief,
  DesignResult,
  HandoffPackage,
  HandoffPayload,
  ImageQuality,
  LlmModel,
  PatternSettings,
  PromptVariant,
  PromptVariantId,
  RuntimeConfig,
  StageId,
  TimelineEvent,
  WorkMode,
} from "@/lib/types";

const STAGES: Array<{
  id: StageId;
  label: string;
  short: string;
  description: string;
  icon: typeof MessageCircle;
}> = [
  {
    id: "brief",
    label: "需求访谈",
    short: "需求",
    description: "场景与体感",
    icon: MessageCircle,
  },
  {
    id: "design",
    label: "设计图",
    short: "设计",
    description: "轮廓与纹样",
    icon: PenLine,
  },
  {
    id: "fabric",
    label: "选择面料",
    short: "面料",
    description: "垂感与支撑",
    icon: Layers,
  },
  {
    id: "pattern",
    label: "版型设计",
    short: "版型",
    description: "余量与结构",
    icon: Ruler,
  },
  {
    id: "sample",
    label: "打样确认",
    short: "打样",
    description: "试身与检查",
    icon: Scissors,
  },
  {
    id: "delivery",
    label: "成衣交付",
    short: "交付",
    description: "方案与交接",
    icon: Package,
  },
];

const createWelcomeMessages = (workMode: WorkMode): ChatMessage[] => [
  {
    id: `welcome-${workMode}`,
    role: "assistant",
    content:
      workMode === "private"
        ? "记录客户原话即可。先说穿着场景、活动量和不想要的细节，我会整理成设计与版型可继续执行的需求。"
        : "先记录团队岗位、使用场景和预估数量。我会把职业服需求整理成版型、面料、工艺与岗位适配可继续执行的结构化台账。",
  },
];

const DEFAULT_MESSAGES = createWelcomeMessages("private");

const DEFAULT_PATTERN: PatternSettings = {
  shoulderDrop: 4,
  armholeEase: 8,
  bodyEase: 12,
  length: "臀中",
  collarForm: "立领",
};

const IMAGE_QUALITY_OPTIONS: Array<{
  id: ImageQuality;
  label: string;
  note: string;
}> = [
  { id: "fast", label: "极速草图", note: "默认 · 性价比优先" },
  { id: "balanced", label: "均衡设计", note: "细节与速度平衡" },
  { id: "quality", label: "精细渲染", note: "更高成本 · 最终确认" },
];

const LLM_OPTIONS: Array<{ id: LlmModel; label: string }> = [
  { id: "deepseek-flash", label: "DeepSeek 4.1 Flash" },
  { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
];

type FieldErrors = Partial<
  Record<"name" | "phone" | "city" | "preferredTime", string>
>;

type PersistedState = {
  messages: ChatMessage[];
  brief: DesignBrief;
  confirmedFields: BriefKey[];
  workMode: WorkMode;
  readiness: number;
  tags: string[];
  activeStage: StageId;
  maxStageIndex: number;
  selectedProductId: string;
  selectedFabricId: string;
  pattern: PatternSettings;
  sampleChecks: string[];
  llmModel: LlmModel;
  imageQuality: ImageQuality;
  soundOn: boolean;
  timeline: TimelineEvent[];
  ledgerNotes: string;
};

type PendingProjectAction =
  | { kind: "reset" }
  | { kind: "mode"; nextMode: WorkMode }
  | { kind: "demo"; caseId: string };

const KNOWLEDGE_ASSETS = buildKnowledgeAssets();
const KNOWLEDGE_COUNTS = knowledgeCounts();

const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const stageIndex = (id: StageId) => STAGES.findIndex((stage) => stage.id === id);

function Seal({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cx("seal", compact && "seal--compact")} aria-hidden="true">
      <span>笺</span>
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cx("status-dot", active && "status-dot--active")}
      aria-label={active ? "服务已连接" : "本地模式"}
    />
  );
}

function useSubtleSound(enabled: boolean) {
  const audioRef = useRef<AudioContext | null>(null);

  return (kind: "tap" | "advance" | "success" = "tap") => {
    if (!enabled || typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = audioRef.current ?? new AudioContextClass();
    audioRef.current = context;
    if (context.state === "suspended") void context.resume();

    const now = context.currentTime;
    const notes =
      kind === "success"
        ? [392, 523.25]
        : kind === "advance"
          ? [293.66, 349.23]
          : [246.94];
    const duration = kind === "tap" ? 0.055 : 0.12;

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.07);
      gain.gain.setValueAtTime(0.0001, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(
        0.025,
        now + index * 0.07 + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + index * 0.07 + duration,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.07);
      oscillator.stop(now + index * 0.07 + duration + 0.02);
    });
  };
}

export function StudioApp({ runtime }: { runtime: RuntimeConfig }) {
  const reducedMotion = useReducedMotion();
  const [workMode, setWorkMode] = useState<WorkMode>("private");
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [brief, setBrief] = useState<DesignBrief>(EMPTY_BRIEF);
  const [confirmedFields, setConfirmedFields] = useState<BriefKey[]>([]);
  const [readiness, setReadiness] = useState(8);
  const [tags, setTags] = useState<string[]>([]);
  const [suggestedAnswers, setSuggestedAnswers] = useState<string[]>([
    "做一件正式但不拘束的新中式外套",
    "婚礼想穿现代海派外套，不要亮片",
    "公司职业服，想保留一点东方气质",
  ]);
  const [activeStage, setActiveStage] = useState<StageId>("brief");
  const [maxStageIndex, setMaxStageIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [agentSource, setAgentSource] = useState<"deepseek" | "fallback">(
    runtime.llmConfigured ? "deepseek" : "fallback",
  );
  const [llmModel, setLlmModel] = useState<LlmModel>(runtime.defaultLlmModel);
  const [imageQuality, setImageQuality] = useState<ImageQuality>("fast");
  const [soundOn, setSoundOn] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedFabricId, setSelectedFabricId] = useState("fabric-wool");
  const [pattern, setPattern] = useState<PatternSettings>(DEFAULT_PATTERN);
  const [sampleChecks, setSampleChecks] = useState<string[]>([]);
  const [designResult, setDesignResult] = useState<DesignResult | null>(null);
  const [designTab, setDesignTab] = useState<"effect" | "pattern">("effect");
  const [activePromptId, setActivePromptId] =
    useState<PromptVariantId>("garment");
  const [designing, setDesigning] = useState(false);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [handoff, setHandoff] = useState<{ id: string; message: string } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [contact, setContact] = useState({
    name: "",
    phone: "",
    city: "上海",
    preferredTime: "工作日下午",
    note: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [assetTab, setAssetTab] = useState<AssetTab>("pattern");
  const [assetQuery, setAssetQuery] = useState("");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [ledgerNotes, setLedgerNotes] = useState("");
  const [pendingProjectAction, setPendingProjectAction] =
    useState<PendingProjectAction | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const destructiveDialogRef = useRef<HTMLDivElement>(null);
  const destructiveCancelRef = useRef<HTMLButtonElement>(null);
  const destructiveTriggerRef = useRef<HTMLElement | null>(null);
  const playSound = useSubtleSound(soundOn);

  const rankedProducts = useMemo(
    () => rankProducts(brief, confirmedFields, workMode, 3),
    [brief, confirmedFields, workMode],
  );
  const selectedProduct =
    rankedProducts.find((product) => product.id === selectedProductId) ??
    rankedProducts[0];
  const availableFabrics = useMemo(
    () => FABRICS.filter((fabric) => fabric.modes.includes(workMode)),
    [workMode],
  );
  const selectedFabric =
    availableFabrics.find((fabric) => fabric.id === selectedFabricId) ??
    availableFabrics[0] ??
    FABRICS[0];
  const recognizedFields = confirmedFields.length;
  const pendingFields = useMemo(
    () =>
      BRIEF_FIELDS.filter(
        (field) =>
          brief[field.key].trim() &&
          !confirmedFields.includes(field.key),
      ).map((field) => ({
        key: field.key,
        label: field.label,
        value: brief[field.key],
      })),
    [brief, confirmedFields],
  );
  const designGate = useMemo(
    () => designGateStatus(brief, confirmedFields),
    [brief, confirmedFields],
  );
  const canOpenDesign = designGate.ready;
  const hasSameFamilyAssets = rankedProducts.length > 0;
  const designActionLabel = !designGate.categoryConfirmed
    ? "先确认品类"
    : designGate.missingDesignCount > 0
      ? `再确认 ${designGate.missingDesignCount} 个设计字段`
      : hasSameFamilyAssets
        ? "整理设计方向"
        : "查看匹配缺口";
  const hasProjectProgress =
    confirmedFields.length > 0 ||
    messages.some((message) => message.role === "user") ||
    activeStage !== "brief" ||
    timeline.length > 0 ||
    Boolean(designResult);
  const currentStageIndex = stageIndex(activeStage);
  const activeStageMeta = STAGES[currentStageIndex];
  const projectName =
    workMode === "private"
      ? brief.category || "海派私定方案"
      : brief.category || "团体职业服方案";
  const sampleCheckItems = useMemo(
    () => deriveSampleChecks(pattern, selectedFabric, selectedProduct),
    [pattern, selectedFabric, selectedProduct],
  );
  const selectedCrafts = useMemo(() => {
    const source = [
      brief.collar,
      brief.shoulder,
      brief.exclusions,
      selectedProduct?.craft ?? "",
    ].join(" ");
    const matches = CRAFTS.filter(
      (craft) =>
        craft.tags.some((tag) => source.includes(tag)) ||
        (workMode === "uniform" && craft.id === "craft-panel-adjustment"),
    );
    return (matches.length > 0 ? matches : CRAFTS.slice(0, 2)).slice(0, 3);
  }, [brief.collar, brief.exclusions, brief.shoulder, selectedProduct, workMode]);
  const filteredAssets = useMemo(() => {
    const query = assetQuery.trim().toLowerCase();
    return KNOWLEDGE_ASSETS.filter(
      (asset) =>
        asset.tab === assetTab &&
        (!query ||
          `${asset.name} ${asset.meta} ${asset.description} ${asset.tags.join(" ")}`
            .toLowerCase()
            .includes(query)),
    );
  }, [assetQuery, assetTab]);
  const designPrompts = designResult?.prompts;
  const promptVariants = useMemo(
    () =>
      designPrompts?.length === 3
        ? designPrompts
        : buildDesignPrompts({
            brief,
            confirmedFields,
            workMode,
            productName: selectedProduct?.name,
            fabricName: selectedFabric.name,
          }),
    [
      brief,
      confirmedFields,
      designPrompts,
      selectedFabric.name,
      selectedProduct?.name,
      workMode,
    ],
  );
  const proposalDraft = useMemo(
    () => ({
      stylePositioning:
        tags.length > 0 ? tags.join(" · ") : "待从对话中提炼审美标签",
      silhouette: brief.silhouette
        ? brief.silhouette
        : selectedProduct
          ? `企业基线参考：${selectedProduct.silhouette}`
          : "待确认",
      fabric: brief.fabric
        ? `${brief.fabric}；企业候选：${selectedFabric.name}`
        : `企业候选：${selectedFabric.name}`,
      collarLength: `${brief.collar || `版型推导：${pattern.collarForm}`} · ${
        brief.length || `版型推导：${pattern.length}`
      }`,
      crafts: selectedCrafts.map((craft) => craft.name).join("、"),
      occasion: brief.occasion || "待确认",
      highlights:
        [brief.color, brief.pattern, brief.exclusions].filter(Boolean).join("；") ||
        (selectedProduct
          ? `企业基线保留：${selectedProduct.craft}`
          : "待顾问从确认需求中提炼"),
    }),
    [brief, pattern.collarForm, pattern.length, selectedCrafts, selectedFabric.name, selectedProduct, tags],
  );

  const risks = useMemo(() => {
    const next: string[] = [];
    if (pattern.shoulderDrop > 7) {
      next.push("落肩量较大，版师需检查肩线支撑与袖山吃势。");
    }
    if (pattern.armholeEase < 6) {
      next.push("袖笼活动量偏小，抬臂时可能紧绷。");
    }
    if (pattern.bodyEase < 8) {
      next.push("胸背余量偏紧，与“宽松不束缚”的目标不完全一致。");
    }
    if (pattern.bodyEase > 18) {
      next.push("整体余量较大，需要复核轮廓是否仍然利落。");
    }
    if (next.length === 0) {
      next.push("当前参数处于建议范围，仍建议用坯布样衣复核活动量。");
    }
    return next;
  }, [pattern]);

  const restoreSavedSession = useCallback((saved: Partial<PersistedState>) => {
    if (saved.messages?.length) setMessages(saved.messages);
    if (saved.brief) setBrief(saved.brief);
    if (saved.workMode) setWorkMode(saved.workMode);
    if (saved.confirmedFields) {
      setConfirmedFields(saved.confirmedFields);
    }
    if (typeof saved.readiness === "number") setReadiness(saved.readiness);
    if (saved.tags?.length) setTags(saved.tags);
    if (saved.activeStage) setActiveStage(saved.activeStage);
    if (typeof saved.maxStageIndex === "number") {
      setMaxStageIndex(saved.maxStageIndex);
    }
    if (saved.selectedProductId) {
      setSelectedProductId(saved.selectedProductId);
    }
    if (saved.selectedFabricId) {
      setSelectedFabricId(saved.selectedFabricId);
    }
    if (saved.pattern) setPattern(saved.pattern);
    if (saved.sampleChecks) setSampleChecks(saved.sampleChecks);
    if (saved.llmModel) setLlmModel(saved.llmModel);
    if (saved.imageQuality) setImageQuality(saved.imageQuality);
    if (typeof saved.soundOn === "boolean") setSoundOn(saved.soundOn);
    if (saved.timeline) setTimeline(saved.timeline);
    if (typeof saved.ledgerNotes === "string") setLedgerNotes(saved.ledgerNotes);
    setHydrated(true);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("haishang-yijian-session");
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PersistedState>;
        window.setTimeout(() => restoreSavedSession(saved), 0);
      } else {
        window.setTimeout(() => setHydrated(true), 0);
      }
    } catch {
      window.setTimeout(() => setHydrated(true), 0);
    }
  }, [restoreSavedSession]);

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedState = {
      messages,
      brief,
      confirmedFields,
      workMode,
      readiness,
      tags,
      activeStage,
      maxStageIndex,
      selectedProductId,
      selectedFabricId,
      pattern,
      sampleChecks,
      llmModel,
      imageQuality,
      soundOn,
      timeline,
      ledgerNotes,
    };
    window.localStorage.setItem(
      "haishang-yijian-session",
      JSON.stringify(state),
    );
  }, [
    activeStage,
    brief,
    confirmedFields,
    hydrated,
    imageQuality,
    llmModel,
    maxStageIndex,
    messages,
    pattern,
    readiness,
    sampleChecks,
    selectedFabricId,
    selectedProductId,
    soundOn,
    tags,
    ledgerNotes,
    timeline,
    workMode,
  ]);

  useEffect(() => {
    if (messages.length <= 1 && !thinking) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, reducedMotion, thinking, suggestedAnswers]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!pendingProjectAction) return;
    destructiveTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusTimer = window.setTimeout(
      () => destructiveCancelRef.current?.focus(),
      20,
    );
    return () => {
      window.clearTimeout(focusTimer);
      window.setTimeout(() => destructiveTriggerRef.current?.focus(), 0);
    };
  }, [pendingProjectAction]);

  const recordTimeline = useCallback((action: string, detail: string) => {
    setTimeline((current) =>
      [
        ...current,
        { at: new Date().toISOString(), action, detail },
      ].slice(-60),
    );
  }, []);

  const openStage = (index: number) => {
    if (index > maxStageIndex) return;
    playSound("advance");
    recordTimeline("查看阶段", STAGES[index].label);
    setActiveStage(STAGES[index].id);
  };

  const advanceTo = (stage: StageId) => {
    const index = stageIndex(stage);
    playSound("advance");
    recordTimeline("推进阶段", STAGES[index].label);
    setMaxStageIndex((current) => Math.max(current, index));
    setActiveStage(stage);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const sendMessage = async (provided?: string) => {
    const content = (provided ?? draft).trim();
    if (!content || thinking) return;

    playSound("tap");
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    recordTimeline("记录客户需求", content.slice(0, 120));
    setDraft("");
    setSuggestedAnswers([]);
    setThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: llmModel,
          messages: nextMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
          brief,
          confirmedFields,
          workMode,
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");
      const result = (await response.json()) as AgentResponse & {
        notice?: string;
      };
      setMessages([
        ...nextMessages,
        {
          id: createId(),
          role: "assistant",
          content: result.reply,
        },
      ]);
      setBrief(result.brief);
      const nextConfirmed = sanitizeConfirmedFields(
        result.confirmedFields,
        result.brief,
      );
      setConfirmedFields(nextConfirmed);
      setTags(result.tags);
      setReadiness(
        Math.min(
          result.readiness,
          readinessFromBrief(result.brief, nextConfirmed, result.tags.length) + 8,
          96,
        ),
      );
      setSuggestedAnswers(result.suggestedAnswers);
      setAgentSource(result.source);
      recordTimeline(
        result.source === "deepseek" ? "AI 归纳需求" : "本地归纳需求",
        `${nextConfirmed.length} 项已确认`,
      );
      if (result.notice) setToast(result.notice);
    } catch {
      const fallback = fallbackAgentReply(
        content,
        brief,
        confirmedFields,
        workMode,
      );
      setMessages([
        ...nextMessages,
        {
          id: createId(),
          role: "assistant",
          content: fallback.reply,
        },
      ]);
      setBrief(fallback.brief);
      setConfirmedFields(fallback.confirmedFields);
      setTags(fallback.tags);
      setReadiness(fallback.readiness);
      setSuggestedAnswers(fallback.suggestedAnswers);
      setAgentSource("fallback");
      setToast("网络连接中断，已使用本地需求归纳。");
      recordTimeline("本地归纳需求", `${fallback.confirmedFields.length} 项已确认`);
    } finally {
      setThinking(false);
      window.setTimeout(() => composerRef.current?.focus(), 80);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const confirmBriefField = (key: BriefKey) => {
    if (!brief[key].trim() || confirmedFields.includes(key)) return;
    if (isUncertainValue(brief[key])) {
      setToast("这条仍是建议，请先在对话中明确一个具体选择。");
      return;
    }
    const next = [...confirmedFields, key];
    setConfirmedFields(next);
    setReadiness(readinessFromBrief(brief, next, tags.length));
    recordTimeline(
      "确认需求字段",
      `${BRIEF_FIELDS.find((field) => field.key === key)?.label ?? key}：${brief[key]}`,
    );
  };

  const openDesignStage = () => {
    if (!canOpenDesign) {
      setToast("请先确认品类，并至少确认 3 个设计相关字段。");
      return;
    }
    const topProduct = rankedProducts[0];
    if (topProduct) {
      setSelectedProductId(topProduct.id);
      setPattern(derivePattern(brief, confirmedFields, topProduct));
    }
    advanceTo("design");
  };

  const selectLook = (product: (typeof CATALOG)[number]) => {
    setSelectedProductId(product.id);
    setPattern(derivePattern(brief, confirmedFields, product));
    setDesignResult(null);
    recordTimeline("选择设计基线", product.name);
    playSound("tap");
  };

  const openFabricStage = () => {
    if (!selectedProduct) {
      setToast("当前品类暂无同品类企业基线，先返回需求调整品类或补充资产。");
      return;
    }
    const fabric = pickFabric(brief, confirmedFields, selectedProduct, workMode);
    if (fabric) setSelectedFabricId(fabric.id);
    advanceTo("fabric");
  };

  const generateDesign = async () => {
    if (designing || !selectedProduct) return;
    setDesigning(true);
    playSound("advance");
    try {
      const response = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          confirmedFields,
          workMode,
          productName: selectedProduct?.name,
          fabricName: selectedFabric.name,
          imageQuality,
        }),
      });
      if (!response.ok) throw new Error("Design request failed");
      const result = (await response.json()) as DesignResult;
      setDesignResult(result);
      setDesignTab("effect");
      recordTimeline(
        result.generated ? "生成设计图" : "载入企业方案图",
        selectedProduct?.name ?? "当前设计基线",
      );
      if (result.note) setToast(result.note);
    } catch {
      const prompts = buildDesignPrompts({
        brief,
        confirmedFields,
        workMode,
        productName: selectedProduct?.name,
        fabricName: selectedFabric.name,
      });
      setDesignResult({
        imageUrl: selectedProduct?.image ?? "/assets/process/design-effect.png",
        visualKind: "effect",
        prompt: prompts[0].prompt,
        prompts,
        generated: false,
        imageModelLabel:
          IMAGE_QUALITY_OPTIONS.find((item) => item.id === imageQuality)?.label ??
          "极速草图",
        note: "图像服务暂不可用，已保留企业资产图和完整提示词。",
      });
      recordTimeline("载入企业方案图", selectedProduct?.name ?? "当前设计基线");
      setToast("已切换到企业静态设计资产，提示词仍可复制导出。");
    } finally {
      setDesigning(false);
    }
  };

  const confirmFabric = () => {
    recordTimeline("确认面料", selectedFabric.name);
    playSound("advance");
    advanceTo("pattern");
  };

  const confirmPattern = () => {
    setSampleChecks((current) =>
      current.filter((item) => sampleCheckItems.includes(item)),
    );
    recordTimeline(
      "确认版型参数",
      `${pattern.collarForm} · 落肩 ${pattern.shoulderDrop}cm · 袖笼 ${pattern.armholeEase}cm`,
    );
    playSound("advance");
    advanceTo("sample");
  };

  const confirmSample = () => {
    recordTimeline(
      "生成交接方案",
      `${sampleChecks.length}/${sampleCheckItems.length} 项打样检查已确认`,
    );
    playSound("advance");
    advanceTo("delivery");
  };

  const performProjectReset = (nextMode: WorkMode) => {
    window.localStorage.removeItem("haishang-yijian-session");
    setWorkMode(nextMode);
    setMessages(createWelcomeMessages(nextMode));
    setBrief(EMPTY_BRIEF);
    setConfirmedFields([]);
    setReadiness(8);
    setTags([]);
    setSuggestedAnswers([
      "做一件正式但不拘束的新中式外套",
      "婚礼想穿现代海派外套，不要亮片",
      "公司职业服，想保留一点东方气质",
    ]);
    setActiveStage("brief");
    setMaxStageIndex(0);
    setDraft("");
    setThinking(false);
    setDesignResult(null);
    setActivePromptId("garment");
    setSelectedProductId(nextMode === "uniform" ? "look-uniform" : "look-xuanwen");
    setSelectedFabricId(
      nextMode === "uniform" ? "fabric-jacquard" : "fabric-wool",
    );
    setPattern(DEFAULT_PATTERN);
    setSampleChecks([]);
    setHandoff(null);
    setTimeline([]);
    setLedgerNotes("");
    setAssetQuery("");
    setAssetTab("pattern");
    setContact({
      name: "",
      phone: "",
      city: "上海",
      preferredTime: "工作日下午",
      note: "",
    });
    setFieldErrors({});
    setSubmitError("");
    playSound("tap");
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const dismissPendingProjectAction = () => {
    setPendingProjectAction(null);
  };

  const resetProject = () => {
    if (!hasProjectProgress) {
      performProjectReset(workMode);
      setToast("已开始新的定制方案。");
      return;
    }
    setPendingProjectAction({ kind: "reset" });
  };

  const changeWorkMode = (nextMode: WorkMode) => {
    if (nextMode === workMode) return;
    if (!hasProjectProgress) {
      performProjectReset(nextMode);
      setToast(
        nextMode === "private"
          ? "已切换到高端私定协作模式。"
          : "已切换到团体职业服协作模式。",
      );
      return;
    }
    setPendingProjectAction({ kind: "mode", nextMode });
  };

  const handleDestructiveDialogKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dismissPendingProjectAction();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = destructiveDialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const applyDemoCase = (caseId: string) => {
    const demo = DEMO_CASES.find((item) => item.id === caseId);
    if (!demo) return;
    const ranked = rankProducts(
      demo.brief,
      demo.confirmedFields,
      demo.workMode,
      3,
    );
    const product = ranked[0];
    const fabric =
      pickFabric(demo.brief, demo.confirmedFields, product, demo.workMode) ??
      FABRICS[0];
    setWorkMode(demo.workMode);
    setMessages([
      createWelcomeMessages(demo.workMode)[0],
      {
        id: createId(),
        role: "user",
        content: demo.summary,
      },
      {
        id: createId(),
        role: "assistant",
        content:
          "模拟案例已整理为 14 项已确认需求。可以直接进入设计方向，也可以回到需求访谈逐条调整。",
      },
    ]);
    setBrief(demo.brief);
    setConfirmedFields(demo.confirmedFields);
    setTags(demo.tags);
    setSuggestedAnswers([]);
    setReadiness(readinessFromBrief(demo.brief, demo.confirmedFields, demo.tags.length));
    setActiveStage("brief");
    setMaxStageIndex(0);
    setSelectedProductId(product?.id ?? "");
    setSelectedFabricId(fabric.id);
    setPattern(
      product
        ? derivePattern(demo.brief, demo.confirmedFields, product)
        : DEFAULT_PATTERN,
    );
    setSampleChecks([]);
    setDesignResult(null);
    setActivePromptId("garment");
    setHandoff(null);
    setLedgerNotes("");
    setTimeline([
      {
        at: new Date().toISOString(),
        action: "载入模拟案例",
        detail: demo.label,
      },
    ]);
    setToast(`已载入：${demo.label}`);
  };

  const loadDemoCase = (caseId: string) => {
    if (!hasProjectProgress) {
      applyDemoCase(caseId);
      return;
    }
    setPendingProjectAction({ kind: "demo", caseId });
  };

  const confirmPendingProjectAction = () => {
    const action = pendingProjectAction;
    if (!action) return;
    setPendingProjectAction(null);
    if (action.kind === "reset") {
      performProjectReset(workMode);
      setToast("已清空当前方案，并开始新的定制方案。");
      return;
    }
    if (action.kind === "mode") {
      performProjectReset(action.nextMode);
      setToast(
        action.nextMode === "private"
          ? "已切换到高端私定协作模式。"
          : "已切换到团体职业服协作模式。",
      );
      return;
    }
    applyDemoCase(action.caseId);
  };

  const retryAgent = async () => {
    if (thinking || retrying) return;
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf("user");
    if (lastUserIndex < 0) {
      setToast("先发送一条需求，再重试在线模型。");
      return;
    }
    const lastUserMessage = messages[lastUserIndex];
    const requestMessages = messages.slice(0, lastUserIndex + 1);
    setRetrying(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: llmModel,
          messages: requestMessages.map(({ role, content }) => ({
            role,
            content,
          })),
          brief,
          confirmedFields,
          workMode,
        }),
      });
      if (!response.ok) throw new Error("Retry failed");
      const result = (await response.json()) as AgentResponse & {
        notice?: string;
      };
      const nextConfirmed = sanitizeConfirmedFields(
        result.confirmedFields,
        result.brief,
      );
      setMessages([
        ...requestMessages,
        {
          id: createId(),
          role: "assistant",
          content: result.reply,
        },
      ]);
      setBrief(result.brief);
      setConfirmedFields(nextConfirmed);
      setTags(result.tags);
      setReadiness(
        Math.min(
          result.readiness,
          readinessFromBrief(result.brief, nextConfirmed, result.tags.length) + 8,
          96,
        ),
      );
      setSuggestedAnswers(result.suggestedAnswers);
      setAgentSource(result.source);
      recordTimeline(
        result.source === "deepseek" ? "恢复在线模型" : "再次使用本地归纳",
        result.reply.slice(0, 100),
      );
      setToast(
        result.source === "deepseek"
          ? "在线模型已恢复。"
          : result.notice || "在线模型仍未恢复，本地归纳结果已保留。",
      );
    } catch {
      const fallback = fallbackAgentReply(
        lastUserMessage.content,
        brief,
        confirmedFields,
        workMode,
      );
      setMessages([
        ...requestMessages,
        {
          id: createId(),
          role: "assistant",
          content: fallback.reply,
        },
      ]);
      setBrief(fallback.brief);
      setConfirmedFields(fallback.confirmedFields);
      setTags(fallback.tags);
      setReadiness(fallback.readiness);
      setSuggestedAnswers(fallback.suggestedAnswers);
      setAgentSource("fallback");
      setToast("在线模型仍未恢复，已保留可继续操作的本地归纳。");
    } finally {
      setRetrying(false);
    }
  };

  const buildPackage = (): HandoffPackage | null => {
    if (!selectedProduct) return null;
    const product = selectedProduct;
    const prompts =
      designResult?.prompts?.length === 3
        ? designResult.prompts
        : buildDesignPrompts({
        brief,
        confirmedFields,
        workMode,
        productName: product.name,
        fabricName: selectedFabric.name,
      });
    const prompt = prompts[0].prompt;
    return {
      schemaVersion: "haishang-yijian/ledger/v1",
      project: {
        name: `海上衣笺 · ${product.name}`,
        workMode,
        generatedAt: new Date().toISOString(),
      },
      brief,
      confirmedFields,
      aestheticTags: tags,
      ledgerNotes,
      pendingFields,
      selectedProduct: product,
      selectedFabric,
      crafts: selectedCrafts,
      pattern,
      sampleChecks,
      proposal: proposalDraft,
      design: {
        imageUrl: designResult?.imageUrl ?? product.image,
        generated: designResult?.generated ?? false,
        imageModelLabel: designResult?.imageModelLabel ?? "企业静态资产",
        prompt,
        prompts,
      },
      resourceMatches: rankedProducts.map((item) => ({
        id: item.id,
        name: item.name,
        score: item.score,
        reason: item.reason,
        gaps: item.gaps,
      })),
      timeline,
      boundary:
        "本台账用于需求整理、资源匹配和设计沟通，不构成正式报价、版型定稿、交期承诺或生产指令。最终商务与生产决策由上服业务人员完成。",
    };
  };

  const buildLedgerMarkdown = (ledger: HandoffPackage) => {
    const pending = ledger.pendingFields;
    return [
      `# ${ledger.project.name}`,
      "",
      `- 项目类型：${ledger.project.workMode === "private" ? "高端私定" : "团体职业服"}`,
      `- 生成时间：${ledger.project.generatedAt}`,
      `- 当前基线：${ledger.selectedProduct.name}`,
      `- 面料：${ledger.selectedFabric.name}`,
      "",
      "## 六维需求",
      ...BRIEF_DIMENSIONS.flatMap((dimension) => {
        const fields = BRIEF_FIELDS.filter((field) =>
          dimension.keys.includes(field.key),
        );
        return [
          `### ${dimension.label}`,
          ...fields.map(
            (field) =>
              `- ${field.label}：${
                ledger.confirmedFields.includes(field.key)
                  ? ledger.brief[field.key]
                  : "待确认"
              }`,
          ),
        ];
      }),
      "",
      "## 审美标签报告",
      ledger.aestheticTags.length > 0
        ? ledger.aestheticTags.map((tag) => `- ${tag}`).join("\n")
        : "- 暂无已提炼标签",
      "",
      "## 待复核字段",
      ...(pending.length
        ? pending.map((field) => `- ${field.label}：${field.value}`)
        : ["- 无"]),
      "",
      "## 方案初稿",
      `- 风格定位：${ledger.proposal.stylePositioning}`,
      `- 轮廓结构：${ledger.proposal.silhouette}`,
      `- 面料方向：${ledger.proposal.fabric}`,
      `- 领型 / 衣长：${ledger.proposal.collarLength}`,
      `- 工艺组合：${ledger.proposal.crafts}`,
      `- 适用场景：${ledger.proposal.occasion}`,
      `- 设计亮点：${ledger.proposal.highlights}`,
      "",
      "## 资源匹配",
      `- 版型：${ledger.selectedProduct.silhouette}`,
      `- 工艺：${ledger.crafts.map((craft) => craft.name).join("、")}`,
      `- 匹配理由：${ledger.selectedProduct.craft}`,
      "",
      "## 版型参数",
      `- 落肩：${ledger.pattern.shoulderDrop} cm`,
      `- 袖笼活动量：${ledger.pattern.armholeEase} cm`,
      `- 胸背余量：${ledger.pattern.bodyEase} cm`,
      `- 衣长：${ledger.pattern.length}`,
      `- 领型：${ledger.pattern.collarForm}`,
      "",
      "## 打样检查",
      ...(ledger.sampleChecks.length
        ? ledger.sampleChecks.map((check) => `- [x] ${check}`)
        : ["- 全部项目待试身复核"]),
      "",
      "## AI 视觉提示词（3 套）",
      ...ledger.design.prompts.flatMap((prompt) => [
        `### ${prompt.label} · ${prompt.purpose}`,
        "```text",
        prompt.prompt,
        "```",
        "",
      ]),
      "",
      "## 设计图",
      `- 图片：${ledger.design.imageUrl}`,
      `- 类型：${ledger.design.generated ? "实时生成" : "企业静态资产"}`,
      "",
      "## 业务台账备注",
      ledger.ledgerNotes.trim() || "无",
      "",
      "## 操作留痕",
      ...ledger.timeline.map(
        (event) => `- ${event.at} · ${event.action}：${event.detail}`,
      ),
      "",
      "## 能力边界",
      ledger.boundary,
    ].join("\n");
  };

  const downloadPackage = () => {
    playSound("tap");
    const ledger = buildPackage();
    if (!ledger) {
      setToast("当前品类暂无同品类企业基线，不能导出跨品类台账。");
      return;
    }
    const blob = new Blob([buildLedgerMarkdown(ledger)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `haishang-yijian-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    recordTimeline("导出业务台账", "Markdown 台账，包含提示词、资源与留痕");
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(successMessage);
      recordTimeline("复制交付内容", successMessage);
    } catch {
      setToast("复制未完成，请在展开内容中手动选择。");
    }
  };

  const submitHandoff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitError("");
    const errors: FieldErrors = {};
    if (contact.name.trim().length < 2) errors.name = "请填写至少 2 个字的称呼";
    if (contact.phone.trim().length < 6) errors.phone = "请填写可用于联系的号码";
    if (!contact.city.trim()) errors.city = "请填写所在城市";
    if (!contact.preferredTime.trim()) errors.preferredTime = "请选择方便联系的时间";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast("还有联系信息需要补充。");
      window.setTimeout(() => {
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      }, 0);
      return;
    }

    const handoffPackage = buildPackage();
    if (!handoffPackage) {
      setSubmitError("当前品类暂无同品类企业基线，请返回需求调整品类或补充资产。");
      setToast("交接台账未生成：缺少同品类企业基线。");
      return;
    }

    setSubmitting(true);
    const payload: HandoffPayload = {
      package: handoffPackage,
      contact,
    };

    try {
      const response = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Submission failed");
      const result = (await response.json()) as {
        id: string;
        message: string;
      };
      setHandoff(result);
      recordTimeline("生成交接台账", result.id);
      playSound("success");
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    } catch {
      setSubmitError("提交暂未完成，请检查网络后再试。");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePattern = (
    key: "shoulderDrop" | "armholeEase" | "bodyEase",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setPattern((current) => ({
      ...current,
      [key]: Number(event.target.value),
    }));
  };

  return (
    <div className="studio">
      <a className="skip-link" href="#studio-main">
        跳到工作区
      </a>
      <SideRail
        activeStage={activeStage}
        maxStageIndex={maxStageIndex}
        onOpenStage={openStage}
        recognizedFields={recognizedFields}
        projectName={projectName}
        workMode={workMode}
      />

      <div className="studio-main">
        <header className="topbar">
          <div className="topbar__identity">
            <span className="topbar__label">上服定制业务协作台</span>
            <span className="topbar__mode">
              {workMode === "private" ? "高端私定" : "团体职业服"}
            </span>
            <span className="topbar__project">
              {projectName} / {activeStageMeta.label}
            </span>
          </div>

          <div className="topbar__tools">
            <div className="runtime-status" title="AI 服务状态">
              <StatusDot active={agentSource === "deepseek"} />
              <span>{agentSource === "deepseek" ? "AI 在线" : "本地归纳"}</span>
              {agentSource === "fallback" && (
                <button
                  type="button"
                  className="status-retry"
                  onClick={() => void retryAgent()}
                  disabled={retrying || thinking}
                  aria-label="重试在线模型"
                  title="重试在线模型"
                >
                  {retrying ? (
                    <Loader2 className="spin" size={13} />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                </button>
              )}
            </div>

            <label className="model-select">
              <span>对话模型</span>
              <select
                value={llmModel}
                onChange={(event) =>
                  setLlmModel(event.target.value as LlmModel)
                }
                aria-label="选择对话模型"
              >
                {LLM_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setSoundOn((current) => !current);
                setToast(soundOn ? "界面音效已关闭" : "界面音效已开启");
              }}
              aria-label={soundOn ? "关闭界面音效" : "开启界面音效"}
              title={soundOn ? "关闭界面音效" : "开启界面音效"}
            >
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              type="button"
              className="text-button"
              onClick={() => resetProject()}
            >
              <RefreshCw size={16} />
              新建方案
            </button>
          </div>
        </header>

        <main className="workspace" id="studio-main">
          <div className="mobile-brand">
            <Seal compact />
            <div>
              <strong>海上衣笺</strong>
              <span>
                {workMode === "private" ? "高端私定协作" : "团体职业服协作"}
              </span>
            </div>
          </div>

          <MobileStageStrip
            activeStage={activeStage}
            maxStageIndex={maxStageIndex}
            onOpenStage={openStage}
          />

          {activeStage === "brief" && (
            <div className="mobile-stage-action" aria-label="需求阶段主操作">
              <button
                type="button"
                className="primary-button primary-button--wide"
                onClick={openDesignStage}
                disabled={!canOpenDesign}
              >
                {designActionLabel}
                {canOpenDesign ? (
                  <ArrowRight size={18} />
                ) : (
                  <LockKeyhole size={16} />
                )}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStage}
              className="stage-transition"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeStage === "brief" && (
                <section className="chat-stage" aria-labelledby="brief-title">
                  <div className="conversation-pane">
                    <header className="stage-heading">
                      <div>
                        <h1 id="brief-title">
                          {workMode === "private"
                            ? "这件衣服，在哪里穿？"
                            : "这套职业服，服务哪些岗位？"}
                        </h1>
                      </div>
                      <span className="stage-heading__note">
                        {recognizedFields} / {BRIEF_FIELDS.length} 项已确认
                      </span>
                    </header>

                    <div
                      className="messages"
                      aria-live="polite"
                      aria-label="需求对话"
                    >
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          className={cx(
                            "message",
                            message.role === "assistant"
                              ? "message--assistant"
                              : "message--user",
                          )}
                          initial={
                            reducedMotion ? false : { opacity: 0, y: 8 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.24 }}
                        >
                          <span className="message__meta">
                            {message.role === "assistant" ? (
                              <>
                                <Seal compact />
                                衣笺顾问
                              </>
                            ) : (
                              <>
                                <User size={15} />
                                你
                              </>
                            )}
                          </span>
                          <p>{message.content}</p>
                        </motion.div>
                      ))}

                      {thinking && (
                        <div className="message message--assistant">
                          <span className="message__meta">
                            <Seal compact />
                            衣笺顾问
                          </span>
                          <div className="thinking-line">
                            <span />
                            <span />
                            <span />
                            <em>正在整理需求</em>
                          </div>
                        </div>
                      )}

                      {!thinking && suggestedAnswers.length > 0 && (
                        <div className="suggestions" aria-label="快捷回答">
                          {suggestedAnswers.map((suggestion) => (
                            <button
                              type="button"
                              key={suggestion}
                              onClick={() => void sendMessage(suggestion)}
                            >
                              {suggestion}
                              <ChevronRight size={15} />
                            </button>
                          ))}
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="composer">
                      <label htmlFor="brief-input" className="sr-only">
                        描述你的定制需求
                      </label>
                      <textarea
                        id="brief-input"
                        ref={composerRef}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        rows={2}
                        placeholder={
                          workMode === "private"
                            ? "例如：见客外套，肩背宽松，抬手不紧绷，不要亮片。"
                            : "例如：20 人前台与接待团队，抗皱，低调东方气质。"
                        }
                        disabled={thinking}
                      />
                      <button
                        type="button"
                        className="send-button"
                        onClick={() => void sendMessage()}
                        disabled={!draft.trim() || thinking}
                        aria-label="发送需求"
                      >
                        {thinking ? (
                          <Loader2 className="spin" size={19} />
                        ) : (
                          <Send size={18} />
                        )}
                        <span>发送</span>
                      </button>
                      <p className="composer__hint">Enter 发送</p>
                    </div>
                  </div>

                  <aside className="brief-panel" aria-label="实时需求归纳">
                    <div className="brief-panel__head">
                      <div>
                        <h2>顾问需求台账</h2>
                        <p>
                          已确认 {recognizedFields} 项，建议待确认{" "}
                          {pendingFields.length} 项
                        </p>
                      </div>
                      <div className="confirmed-counter" aria-label="已确认需求数量">
                        <strong>{recognizedFields}</strong>
                        <span>项已确认</span>
                      </div>
                    </div>

                    <div className="brief-panel__body">
                      <div className="mode-control" aria-label="选择业务类型">
                      <span>业务类型</span>
                      <div className="segmented segmented--small">
                        <button
                          type="button"
                          className={cx(workMode === "private" && "active")}
                          aria-pressed={workMode === "private"}
                          onClick={() => changeWorkMode("private")}
                        >
                          高端私定
                        </button>
                        <button
                          type="button"
                          className={cx(workMode === "uniform" && "active")}
                          aria-pressed={workMode === "uniform"}
                          onClick={() => changeWorkMode("uniform")}
                        >
                          团体职业服
                        </button>
                      </div>
                      </div>

                      <div className="demo-cases" aria-label="载入模拟业务案例">
                        <div className="demo-cases__head">
                          <span>模拟业务案例</span>
                          <small>全部使用企业静态资产</small>
                        </div>
                        <div className="demo-cases__grid">
                          {DEMO_CASES.map((demo) => (
                            <button
                              type="button"
                              key={demo.id}
                              onClick={() => loadDemoCase(demo.id)}
                            >
                              <strong>{demo.label}</strong>
                              <span>{demo.summary}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <section
                        className="dimension-report"
                        aria-labelledby="dimension-report-title"
                      >
                        <div className="panel-section-head">
                          <h3 id="dimension-report-title">六维需求</h3>
                          <small>{designGate.designConfirmed} 个设计字段已确认</small>
                        </div>
                        <div className="dimension-summary">
                          {BRIEF_DIMENSIONS.map((dimension) => {
                            const confirmedCount = dimension.keys.filter((key) =>
                              confirmedFields.includes(key),
                            ).length;
                            return (
                              <div key={dimension.id}>
                                <span>{dimension.label}</span>
                                <strong>
                                  {confirmedCount}/{dimension.keys.length}
                                </strong>
                                <small>{dimension.description}</small>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      <div className="dimension-groups">
                        {BRIEF_DIMENSIONS.map((dimension) => (
                          <section key={dimension.id} aria-labelledby={`dimension-${dimension.id}`}>
                            <div className="dimension-group__head">
                              <h3 id={`dimension-${dimension.id}`}>{dimension.label}</h3>
                              <small>{dimension.description}</small>
                            </div>
                            <div className="brief-fields">
                              {BRIEF_FIELDS.filter((field) =>
                                dimension.keys.includes(field.key),
                              ).map((field) => (
                                <div
                                  className={cx(
                                    "brief-field",
                                    brief[field.key] && "brief-field--filled",
                                    confirmedFields.includes(field.key) &&
                                      "brief-field--confirmed",
                                    brief[field.key] &&
                                      !confirmedFields.includes(field.key) &&
                                      "brief-field--suggested",
                                  )}
                                  key={field.key}
                                >
                                  <span>
                                    {field.label}
                                    {brief[field.key] && (
                                      <small>
                                        {confirmedFields.includes(field.key)
                                          ? "已确认"
                                          : "待确认"}
                                      </small>
                                    )}
                                  </span>
                                  <strong>{brief[field.key] || "待确认"}</strong>
                                  {brief[field.key] &&
                                    !confirmedFields.includes(field.key) && (
                                      <button
                                        type="button"
                                        className="brief-field__confirm"
                                        onClick={() => confirmBriefField(field.key)}
                                        aria-label={`确认${field.label}`}
                                      >
                                        确认
                                      </button>
                                    )}
                                </div>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>

                      <section
                        className="aesthetic-report"
                        aria-labelledby="aesthetic-report-title"
                      >
                        <div className="panel-section-head">
                          <h3 id="aesthetic-report-title">审美标签报告</h3>
                          <small>{tags.length} 个已提炼标签</small>
                        </div>
                        {tags.length > 0 ? (
                          <div className="tag-row">
                            {tags.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="report-empty">尚未从对话中形成审美标签。</p>
                        )}
                      </section>
                    </div>

                    <div className="brief-panel__footer">
                      <p className="gate-note">
                        <LockKeyhole size={14} />
                        {!designGate.categoryConfirmed
                          ? "进入设计前必须确认品类。"
                          : designGate.missingDesignCount > 0
                            ? `再确认 ${designGate.missingDesignCount} 个设计相关字段即可整理方向。`
                            : hasSameFamilyAssets
                              ? "已满足品类与设计字段门槛。"
                              : "企业资产库暂无同品类基线，进入后可查看明确缺口。"}
                      </p>
                      <button
                        type="button"
                        className="primary-button primary-button--wide"
                        onClick={openDesignStage}
                        disabled={!canOpenDesign}
                      >
                        {designActionLabel}
                        {canOpenDesign ? (
                          <ArrowRight size={18} />
                        ) : (
                          <LockKeyhole size={16} />
                        )}
                      </button>
                      <p className="panel-footnote">
                        <LockKeyhole size={14} />
                        不报价、不承诺交期。最终版型与商务事项由上服顾问确认。
                      </p>
                    </div>
                  </aside>
                </section>
              )}

              {activeStage === "design" && (
                <section className="content-stage" aria-labelledby="design-title">
                  <header className="stage-heading stage-heading--wide">
                    <div>
                      <h1 id="design-title">确认设计基线。</h1>
                    </div>
                    <button
                      type="button"
                      className="back-link"
                      onClick={() => setActiveStage("brief")}
                    >
                      <ArrowLeft size={16} />
                      补充需求
                    </button>
                  </header>

                  <div className="design-layout">
                    <div>
                      <div className="section-line-head">
                        <span>推荐方向</span>
                        <small>
                          {hasSameFamilyAssets
                            ? "仅展示同品类企业资产"
                            : "当前品类暂无企业基线"}
                        </small>
                      </div>
                      {hasSameFamilyAssets ? (
                        <div className="direction-grid">
                          {rankedProducts.map((product, index) => (
                          <button
                            type="button"
                            key={product.id}
                            className={cx(
                              "direction-card",
                              selectedProduct?.id === product.id &&
                                "direction-card--selected",
                            )}
                            onClick={() => selectLook(product)}
                            aria-pressed={selectedProduct?.id === product.id}
                          >
                            <span className="direction-card__index">
                              0{index + 1}
                            </span>
                            <div className="direction-card__image">
                              <img
                                src={product.image}
                                alt={`${product.name}款式参考`}
                              />
                              <span className="match-score">
                                {product.score}% 匹配
                              </span>
                            </div>
                            <div className="direction-card__body">
                              <h3>{product.name}</h3>
                              <p>{product.subtitle}</p>
                              <span className="direction-card__reason">
                                {product.reason}
                              </span>
                              {product.gaps.length > 0 && (
                                <span className="direction-card__gap">
                                  待复核：{product.gaps.join("；")}
                                </span>
                              )}
                            </div>
                            <span className="selection-indicator">
                              {selectedProduct?.id === product.id ? (
                                <Check size={16} />
                              ) : null}
                            </span>
                          </button>
                          ))}
                        </div>
                      ) : (
                        <div className="direction-empty" role="status">
                          <span>暂无同品类企业资产</span>
                          <h2>不能把外套或衬衫当作当前品类基线。</h2>
                          <p>
                            当前需求为“{brief.category}”，企业资产库中还没有可匹配的同品类版型。系统已停止推荐与跨品类推进，请返回补充品类或等待资产入库。
                          </p>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setActiveStage("brief")}
                          >
                            <ArrowLeft size={16} />
                            返回修改品类
                          </button>
                        </div>
                      )}

                      <details className="asset-library">
                        <summary>
                          <LibraryBig size={17} />
                          <span>企业定制资产库</span>
                          <small>
                            版型 {KNOWLEDGE_COUNTS.pattern} · 面料{" "}
                            {KNOWLEDGE_COUNTS.fabric} · 工艺{" "}
                            {KNOWLEDGE_COUNTS.craft} · 案例{" "}
                            {KNOWLEDGE_COUNTS.case}
                          </small>
                        </summary>
                        <div className="asset-library__body">
                          <label className="asset-search">
                            <Search size={15} />
                            <span className="sr-only">检索企业定制资产</span>
                            <input
                              value={assetQuery}
                              onChange={(event) => setAssetQuery(event.target.value)}
                              placeholder="按版型、面料、工艺或场景检索"
                            />
                          </label>
                          <div className="asset-tabs" role="tablist" aria-label="资产分类">
                            {(
                              [
                                ["pattern", "版型"],
                                ["fabric", "面料"],
                                ["craft", "工艺"],
                                ["case", "案例"],
                              ] as Array<[AssetTab, string]>
                            ).map(([tab, label]) => (
                              <button
                                type="button"
                                role="tab"
                                key={tab}
                                aria-selected={assetTab === tab}
                                className={cx(assetTab === tab && "active")}
                                onClick={() => setAssetTab(tab)}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <div className="asset-list">
                            {filteredAssets.length > 0 ? (
                              filteredAssets.map((asset) => (
                                <article key={asset.id}>
                                  <div>
                                    <strong>{asset.name}</strong>
                                    <small>{asset.meta}</small>
                                  </div>
                                  <p>{asset.description}</p>
                                  <div className="asset-list__tags">
                                    {asset.tags.slice(0, 4).map((tag) => (
                                      <span key={tag}>{tag}</span>
                                    ))}
                                  </div>
                                </article>
                              ))
                            ) : (
                              <div className="asset-empty">
                                当前分类没有检索结果，换一个关键词继续查找。
                              </div>
                            )}
                          </div>
                        </div>
                      </details>

                      {selectedProduct && (
                        <section
                          className="proposal-draft"
                          aria-labelledby="proposal-draft-title"
                        >
                          <div className="proposal-draft__head">
                            <h2 id="proposal-draft-title">方案初稿</h2>
                            <small>已确认需求 + 明确标注的企业资产参考</small>
                          </div>
                          <dl>
                            <div>
                              <dt>风格定位</dt>
                              <dd>{proposalDraft.stylePositioning}</dd>
                            </div>
                            <div>
                              <dt>轮廓结构</dt>
                              <dd>{proposalDraft.silhouette}</dd>
                            </div>
                            <div>
                              <dt>面料方向</dt>
                              <dd>{proposalDraft.fabric}</dd>
                            </div>
                            <div>
                              <dt>领型 / 衣长</dt>
                              <dd>{proposalDraft.collarLength}</dd>
                            </div>
                            <div>
                              <dt>工艺组合</dt>
                              <dd>{proposalDraft.crafts}</dd>
                            </div>
                            <div>
                              <dt>适用场景</dt>
                              <dd>{proposalDraft.occasion}</dd>
                            </div>
                            <div className="proposal-draft__wide">
                              <dt>设计亮点</dt>
                              <dd>{proposalDraft.highlights}</dd>
                            </div>
                          </dl>
                        </section>
                      )}

                      {selectedProduct && (
                        <div className="design-output">
                        <div className="design-output__head">
                          <div>
                            <h2>方案图面</h2>
                          </div>
                          <div className="segmented segmented--small">
                            <button
                              type="button"
                              className={cx(designTab === "effect" && "active")}
                              onClick={() => setDesignTab("effect")}
                            >
                              效果图
                            </button>
                            <button
                              type="button"
                              className={cx(designTab === "pattern" && "active")}
                              onClick={() => setDesignTab("pattern")}
                            >
                              款式平面
                            </button>
                          </div>
                        </div>

                        <figure className="design-canvas">
                          <img
                            src={
                              designTab === "effect"
                                ? designResult?.imageUrl ||
                                  selectedProduct?.image ||
                                  "/assets/process/design-effect.png"
                                : "/assets/process/pattern-sheet.png"
                            }
                            alt={
                              designTab === "effect"
                                ? "定制设计效果图"
                                : "CAD纸样与款式结构参考"
                            }
                          />
                          <figcaption>
                            <span>
                              {designTab === "effect"
                                ? designResult?.generated
                                  ? "实时生成效果"
                                  : "企业静态设计资产"
                                : "款式结构与CAD版型参考"}
                            </span>
                            <small>
                              {designTab === "effect"
                                ? selectedProduct?.name
                                : "最终纸样由版师复核"}
                            </small>
                          </figcaption>
                        </figure>
                        </div>
                      )}
                    </div>

                    <aside className="settings-panel">
                      <h2>设计设置</h2>

                      <div className="selected-summary">
                        <span>当前设计基线</span>
                        <strong>{selectedProduct?.name ?? "暂无同品类基线"}</strong>
                        <small>
                          {selectedProduct?.silhouette ??
                            "请返回需求调整品类，或等待企业资产入库"}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="primary-button primary-button--wide"
                        onClick={openFabricStage}
                        disabled={!selectedProduct}
                      >
                        {selectedProduct ? "用这个方向选面料" : "暂无可用设计基线"}
                        <ArrowRight size={18} />
                      </button>

                      <details className="prompt-box generation-settings">
                        <summary>
                          <Sparkles size={15} />
                          生成方案图
                          <span>可选</span>
                        </summary>
                        <div className="generation-settings__body">
                          <fieldset className="model-choices" disabled={!selectedProduct}>
                            <legend>图像模型</legend>
                            {IMAGE_QUALITY_OPTIONS.map((option) => (
                              <label
                                key={option.id}
                                className={cx(
                                  "model-choice",
                                  imageQuality === option.id &&
                                    "model-choice--active",
                                )}
                              >
                                <input
                                  type="radio"
                                  name="image-quality"
                                  value={option.id}
                                  checked={imageQuality === option.id}
                                  onChange={() => setImageQuality(option.id)}
                                />
                                <span>
                                  <strong>{option.label}</strong>
                                  <small>{option.note}</small>
                                </span>
                                {imageQuality === option.id && <Check size={16} />}
                              </label>
                            ))}
                          </fieldset>

                          <div className="provider-state">
                            <StatusDot active={runtime.imageApiConfigured} />
                            <div>
                              <strong>
                                {runtime.imageApiConfigured
                                  ? "图像服务"
                                  : "本地资产"}
                              </strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="secondary-button primary-button--wide"
                            onClick={() => void generateDesign()}
                            disabled={designing || !selectedProduct}
                          >
                            {designing ? (
                              <Loader2 className="spin" size={18} />
                            ) : (
                              <Sparkles size={18} />
                            )}
                            {designing ? "正在绘制方案" : "生成设计方案图"}
                          </button>
                        </div>
                      </details>

                      <details className="prompt-box">
                        <summary>
                          <BookOpen size={15} />
                          成套视觉提示词
                          <span>3 套</span>
                        </summary>
                        <PromptPack
                          prompts={promptVariants}
                          activeId={activePromptId}
                          onActiveChange={setActivePromptId}
                          onCopy={copyText}
                          onDownload={selectedProduct ? downloadPackage : undefined}
                          idPrefix="design-prompts"
                        />
                      </details>
                    </aside>
                  </div>
                </section>
              )}

              {activeStage === "fabric" && (
                <section className="content-stage" aria-labelledby="fabric-title">
                  <header className="stage-heading stage-heading--wide">
                    <div>
                      <h1 id="fabric-title">选面料，先看体感。</h1>
                    </div>
                    <button
                      type="button"
                      className="back-link"
                      onClick={() => setActiveStage("design")}
                    >
                      <ArrowLeft size={16} />
                      返回设计
                    </button>
                  </header>

                  <div className="fabric-layout">
                    <div className="fabric-grid">
                      {availableFabrics.map((fabric, index) => (
                        <button
                          type="button"
                          key={fabric.id}
                          className={cx(
                            "fabric-card",
                            selectedFabric.id === fabric.id &&
                              "fabric-card--selected",
                          )}
                          onClick={() => {
                            setSelectedFabricId(fabric.id);
                            playSound("tap");
                          }}
                          aria-pressed={selectedFabric.id === fabric.id}
                        >
                          <span className="fabric-card__index">
                            0{index + 1}
                          </span>
                          <span
                            className={cx("fabric-swatch", fabric.swatchClass)}
                            aria-hidden="true"
                          />
                          <span className="fabric-card__body">
                            <span className="fabric-card__kind">
                              {fabric.composition}
                            </span>
                            <strong>{fabric.name}</strong>
                            <small>{fabric.handfeel}</small>
                          </span>
                          {selectedFabric.id === fabric.id && (
                            <span className="fabric-card__check">
                              <Check size={15} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <aside className="rationale-panel">
                      <h2>{selectedFabric.name}</h2>
                      <p className="rationale-panel__lead">
                        {selectedFabric.composition} · {selectedFabric.handfeel}
                      </p>
                      <div className="rationale-quote">
                        <span>适配</span>
                        <p>{selectedFabric.rationale}</p>
                      </div>
                      <div className="tag-row">
                        {selectedFabric.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <dl className="data-list">
                        <div>
                          <dt>使用方向</dt>
                          <dd>{selectedProduct?.name}</dd>
                        </div>
                        <div>
                          <dt>设计基线</dt>
                          <dd>{brief.silhouette || selectedProduct?.silhouette}</dd>
                        </div>
                        <div>
                          <dt>适用场景</dt>
                          <dd>{selectedFabric.bestFor}</dd>
                        </div>
                        <div>
                          <dt>工艺组合</dt>
                          <dd>{selectedCrafts.map((craft) => craft.name).join("、")}</dd>
                        </div>
                        <div>
                          <dt>需要复核</dt>
                          <dd>{selectedFabric.caution}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        className="primary-button primary-button--wide"
                        onClick={confirmFabric}
                      >
                        确认面料
                        <ArrowRight size={18} />
                      </button>
                    </aside>
                  </div>
                </section>
              )}

              {activeStage === "pattern" && (
                <section className="content-stage" aria-labelledby="pattern-title">
                  <header className="stage-heading stage-heading--wide">
                    <div>
                      <h1 id="pattern-title">把舒适变成参数。</h1>
                    </div>
                    <button
                      type="button"
                      className="back-link"
                      onClick={() => setActiveStage("fabric")}
                    >
                      <ArrowLeft size={16} />
                      返回面料
                    </button>
                  </header>

                  <div className="pattern-layout">
                    <div className="pattern-visual">
                      <img
                        src="/assets/process/pattern-sheet.png"
                        alt={`企业版型参考图，当前方案为${pattern.collarForm}、${pattern.length}衣长`}
                      />
                      <div className="pattern-visual__label">
                        <span>企业纸样示意</span>
                        <small>当前领型与衣长已带入，最终版型由版师复核</small>
                      </div>
                    </div>

                    <aside className="pattern-controls">
                      <h2>版型交接参数</h2>
                      <p className="derived-note">
                        已从需求带入：
                        {brief.collar || "领型待确认"} ·{" "}
                        {brief.length || "衣长待确认"}
                      </p>

                      <button
                        type="button"
                        className="primary-button primary-button--wide"
                        onClick={confirmPattern}
                      >
                        生成版型交接单
                        <ArrowRight size={18} />
                      </button>

                      <SliderField
                        id="shoulder-drop"
                        label="落肩量"
                        value={pattern.shoulderDrop}
                        min={0}
                        max={12}
                        suffix="cm"
                        onChange={(event) =>
                          updatePattern("shoulderDrop", event)
                        }
                      />
                      <SliderField
                        id="armhole-ease"
                        label="袖笼活动量"
                        value={pattern.armholeEase}
                        min={2}
                        max={16}
                        suffix="cm"
                        onChange={(event) =>
                          updatePattern("armholeEase", event)
                        }
                      />
                      <SliderField
                        id="body-ease"
                        label="胸背余量"
                        value={pattern.bodyEase}
                        min={4}
                        max={24}
                        suffix="cm"
                        onChange={(event) => updatePattern("bodyEase", event)}
                      />

                      <fieldset className="compact-fieldset">
                        <legend>衣长位置</legend>
                        <div className="segmented segmented--full">
                          {["髋上", "臀中", "膝上"].map((length) => (
                            <button
                              type="button"
                              key={length}
                              className={cx(
                                pattern.length === length && "active",
                              )}
                              aria-pressed={pattern.length === length}
                              onClick={() =>
                                setPattern((current) => ({
                                  ...current,
                                  length,
                                }))
                              }
                            >
                              {length}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="compact-fieldset">
                        <legend>领型结构</legend>
                        <div className="segmented segmented--full">
                          {["交领开敞", "立领", "无领"].map((collar) => (
                            <button
                              type="button"
                              key={collar}
                              className={cx(
                                pattern.collarForm === collar && "active",
                              )}
                              aria-pressed={pattern.collarForm === collar}
                              onClick={() =>
                                setPattern((current) => ({
                                  ...current,
                                  collarForm: collar,
                                }))
                              }
                            >
                              {collar}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <div className="risk-block">
                        <div className="risk-block__head">
                          <AlertCircle size={17} />
                          <span>版型风险提示</span>
                        </div>
                        {risks.map((risk) => (
                          <p key={risk}>{risk}</p>
                        ))}
                      </div>

                    </aside>
                  </div>
                </section>
              )}

              {activeStage === "sample" && (
                <section className="content-stage" aria-labelledby="sample-title">
                  <header className="stage-heading stage-heading--wide">
                    <div>
                      <h1 id="sample-title">检查能活动，再谈好看。</h1>
                    </div>
                    <button
                      type="button"
                      className="back-link"
                      onClick={() => setActiveStage("pattern")}
                    >
                      <ArrowLeft size={16} />
                      返回版型
                    </button>
                  </header>

                  <div className="sample-layout">
                    <figure className="sample-photo">
                      <img
                        src="/assets/process/sample.png"
                        alt={`企业白坯样衣结构示意，当前方案为${pattern.collarForm}、${pattern.length}衣长`}
                      />
                      <figcaption>
                        <span>企业白坯工艺示意</span>
                        <small>
                          当前按 {pattern.collarForm} · {pattern.length} 复核肩位、袖笼与衣长
                        </small>
                      </figcaption>
                    </figure>

                    <div className="sample-checks">
                      <div className="section-line-head">
                        <span>打样检查单</span>
                        <small>
                          {sampleChecks.length}/{sampleCheckItems.length} 已确认
                        </small>
                      </div>
                      {sampleCheckItems.map((check) => {
                        const checked = sampleChecks.includes(check);
                        return (
                          <label
                            key={check}
                            className={cx(
                              "check-row",
                              checked && "check-row--checked",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSampleChecks((current) =>
                                  checked
                                    ? current.filter((item) => item !== check)
                                    : [...current, check],
                                )
                              }
                            />
                            <span className="check-row__box">
                              {checked && <Check size={14} />}
                            </span>
                            <span>{check}</span>
                            <small>
                              {checked ? "已通过" : "待样衣确认"}
                            </small>
                          </label>
                        );
                      })}
                      <div className="sample-note">
                        <FileText size={18} />
                        <p>未确认项将以“待顾问复核”进入最终方案。</p>
                      </div>
                      <button
                        type="button"
                        className="primary-button primary-button--wide"
                        onClick={confirmSample}
                      >
                        记录检查并生成方案
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {activeStage === "delivery" && (
                <section className="content-stage delivery-stage" aria-labelledby="delivery-title">
                  {handoff ? (
                    <div className="handoff-success">
                      <span className="success-seal">
                        <CheckCircle2 size={34} />
                      </span>
                      <h1 id="delivery-title">业务交接台账已生成。</h1>
                      <p className="handoff-success__message">
                        {handoff.message}
                      </p>
                      <div className="handoff-id">
                        <span>方案编号</span>
                        <strong>{handoff.id}</strong>
                      </div>
                      <p className="handoff-success__note">
                        台账已包含确认状态、资源快照、版型参数、视觉提示词和操作留痕。接入业务流程后，顾问可直接复核；当前原型不触达真实生产系统。
                      </p>
                      <div className="button-row">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={downloadPackage}
                        >
                          <Download size={17} />
                          下载业务台账
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => window.print()}
                        >
                          <Printer size={17} />
                          打印确认页
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setHandoff(null);
                            setActiveStage("brief");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <ArrowLeft size={17} />
                          返回修改需求
                        </button>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={resetProject}
                        >
                          新建方案
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <header className="stage-heading stage-heading--wide">
                        <div>
                          <h1 id="delivery-title">生成可接手的方案。</h1>
                        </div>
                        <div className="stage-heading__actions">
                          <button
                            type="button"
                            className="back-link"
                            onClick={() => setActiveStage("brief")}
                          >
                            <ArrowLeft size={16} />
                            返回修改需求
                          </button>
                          <button
                            type="button"
                            className="back-link"
                            onClick={() => setActiveStage("sample")}
                          >
                            <ArrowLeft size={16} />
                            返回打样
                          </button>
                        </div>
                      </header>

                      <div className="delivery-hero">
                        <figure className="delivery-hero__main">
                          <img
                            src={selectedProduct?.image ?? "/assets/process/design-effect.png"}
                            alt={`${selectedProduct?.name ?? "当前方案"}企业设计资产参考`}
                          />
                        </figure>
                        <div className="delivery-hero__copy">
                          <h2>{selectedProduct?.name}</h2>
                          <p>
                            {workMode === "private" ? "高端私定" : "团体职业服"} ·
                            {brief.audience || "使用人群待确认"}
                          </p>
                          <dl className="delivery-facts">
                            <div>
                              <dt>结构</dt>
                              <dd>{brief.silhouette || selectedProduct?.silhouette}</dd>
                            </div>
                            <div>
                              <dt>面料</dt>
                              <dd>{selectedFabric.name}</dd>
                            </div>
                            <div>
                              <dt>领型 / 衣长</dt>
                              <dd>
                                {pattern.collarForm} · {pattern.length}
                              </dd>
                            </div>
                            <div>
                              <dt>版型重点</dt>
                              <dd>
                                落肩 {pattern.shoulderDrop}cm · 袖笼{" "}
                                {pattern.armholeEase}cm · 余量{" "}
                                {pattern.bodyEase}cm
                              </dd>
                            </div>
                            <div>
                              <dt>数量</dt>
                              <dd>{brief.quantity || "待确认"}</dd>
                            </div>
                          </dl>
                          <div className="button-row">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={downloadPackage}
                            >
                              <Download size={17} />
                              导出业务台账
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => window.print()}
                            >
                              <Printer size={17} />
                              打印方案
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="delivery-grid">
                        <article className="delivery-section">
                          <span className="delivery-section__index">01</span>
                          <div>
                            <h3>数字需求</h3>
                            <p>
                              {brief.category || "新中式外套"} ·{" "}
                              {brief.occasion || "正式场合"} ·{" "}
                              {brief.ease || "肩背和袖管活动量充足"}
                            </p>
                          </div>
                        </article>
                        <article className="delivery-section">
                          <span className="delivery-section__index">02</span>
                          <div>
                            <h3>资源匹配</h3>
                            <p>
                              {selectedProduct?.reason}；工艺组合：
                              {selectedCrafts.map((craft) => craft.name).join("、")}
                            </p>
                          </div>
                        </article>
                        <article className="delivery-section">
                          <span className="delivery-section__index">03</span>
                          <div>
                            <h3>打样记录</h3>
                            <p>
                              {sampleChecks.length > 0
                                ? `已确认：${sampleChecks.join("、")}`
                                : "全部检查项待顾问在试身阶段复核"}
                            </p>
                          </div>
                        </article>
                        <article className="delivery-section">
                          <span className="delivery-section__index">04</span>
                          <div>
                            <h3>待复核字段</h3>
                            <p>
                              {pendingFields.length > 0
                                ? pendingFields
                                    .map((field) => `${field.label}：${field.value}`)
                                    .join("；")
                                : "所有关键字段均已确认。"}
                            </p>
                          </div>
                        </article>
                        <article className="delivery-section">
                          <span className="delivery-section__index">05</span>
                          <div>
                            <h3>视觉提示词</h3>
                            <p>成衣效果、工艺细节与上身穿搭三套提示词已进入台账。</p>
                          </div>
                        </article>
                        <article className="delivery-section">
                          <span className="delivery-section__index">06</span>
                          <div>
                            <h3>操作留痕</h3>
                            <p>
                              {timeline.length > 0
                                ? `${timeline.length} 条记录，从需求确认到方案导出均可追溯。`
                                : "当前会话尚未产生阶段操作记录。"}
                            </p>
                          </div>
                        </article>
                      </div>

                      <div className="delivery-bottom">
                        <section className="delivery-ledger" aria-labelledby="ledger-prompt-title">
                          <h2 id="ledger-prompt-title">成套视觉提示词</h2>
                          <PromptPack
                            prompts={promptVariants}
                            activeId={activePromptId}
                            onActiveChange={setActivePromptId}
                            onCopy={copyText}
                            onDownload={downloadPackage}
                            idPrefix="delivery-prompts"
                          />
                          <div className="ledger-notes">
                            <label htmlFor="ledger-notes">
                              业务台账备注
                              <small>会随 Markdown 与交接台账一并导出</small>
                            </label>
                            <textarea
                              id="ledger-notes"
                              rows={4}
                              value={ledgerNotes}
                              onChange={(event) => setLedgerNotes(event.target.value)}
                              placeholder="例如：客户希望先确认肩背活动量，再安排面料小样复核。"
                            />
                          </div>
                        </section>

                        <form className="handoff-form" onSubmit={submitHandoff}>
                          <h2>交给上服顾问</h2>
                          <p>
                            生成包含方案与留痕的交接台账。真实业务接入前，文件保存在本地模拟目录。
                          </p>

                          <div className="form-grid">
                            <FormField label="联系人称呼" error={fieldErrors.name}>
                              <input
                                type="text"
                                autoComplete="name"
                                value={contact.name}
                                onChange={(event) =>
                                  setContact((current) => ({
                                    ...current,
                                    name: event.target.value,
                                  }))
                                }
                                aria-invalid={Boolean(fieldErrors.name)}
                                placeholder="例如：林女士"
                              />
                            </FormField>
                            <FormField label="联系电话或微信" error={fieldErrors.phone}>
                              <input
                                type="tel"
                                autoComplete="tel"
                                value={contact.phone}
                                onChange={(event) =>
                                  setContact((current) => ({
                                    ...current,
                                    phone: event.target.value,
                                  }))
                                }
                                aria-invalid={Boolean(fieldErrors.phone)}
                                placeholder="手机号或微信"
                              />
                            </FormField>
                            <FormField label="所在城市" error={fieldErrors.city}>
                              <input
                                type="text"
                                autoComplete="address-level2"
                                value={contact.city}
                                onChange={(event) =>
                                  setContact((current) => ({
                                    ...current,
                                    city: event.target.value,
                                  }))
                                }
                                aria-invalid={Boolean(fieldErrors.city)}
                              />
                            </FormField>
                            <FormField
                              label="联系时间"
                              error={fieldErrors.preferredTime}
                            >
                              <select
                                value={contact.preferredTime}
                                onChange={(event) =>
                                  setContact((current) => ({
                                    ...current,
                                    preferredTime: event.target.value,
                                  }))
                                }
                                aria-invalid={Boolean(fieldErrors.preferredTime)}
                              >
                                <option>工作日上午</option>
                                <option>工作日下午</option>
                                <option>周末</option>
                                <option>都可以</option>
                              </select>
                            </FormField>
                          </div>

                          <FormField label="补充说明" optional>
                            <textarea
                              rows={3}
                              value={contact.note}
                              onChange={(event) =>
                                setContact((current) => ({
                                  ...current,
                                  note: event.target.value,
                                }))
                              }
                              placeholder="例如：希望先确认肩背余量，再约量体时间。"
                            />
                          </FormField>

                          {submitError && (
                            <p className="form-error" role="alert">
                              <AlertCircle size={16} />
                              {submitError}
                            </p>
                          )}

                          <button
                            type="submit"
                            className="primary-button primary-button--wide"
                            disabled={submitting}
                          >
                            {submitting ? (
                              <Loader2 className="spin" size={18} />
                            ) : (
                              <Send size={17} />
                            )}
                            {submitting ? "正在生成台账" : "生成交接台账"}
                          </button>
                          <p className="form-disclaimer">
                            联系人信息仅用于本次定制承接。原型不连接真实 CRM、生产系统或报价系统。
                          </p>
                        </form>
                      </div>
                    </>
                  )}
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {pendingProjectAction && (
          <motion.div
            className="dialog-backdrop"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                dismissPendingProjectAction();
              }
            }}
          >
            <motion.div
              ref={destructiveDialogRef}
              className="confirmation-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirmation-title"
              aria-describedby="confirmation-description"
              tabIndex={-1}
              onKeyDown={handleDestructiveDialogKeyDown}
              initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="confirmation-dialog__icon">
                <AlertCircle size={22} />
              </span>
              <div>
                <h2 id="confirmation-title">
                  {pendingProjectAction.kind === "mode"
                    ? "切换业务类型并新建方案？"
                    : pendingProjectAction.kind === "demo"
                      ? "载入案例并替换当前方案？"
                      : "清空当前方案？"}
                </h2>
                <p id="confirmation-description">
                  {pendingProjectAction.kind === "mode"
                    ? "当前会话中的已确认需求、设计选择、版型参数和台账备注会全部清空。"
                    : pendingProjectAction.kind === "demo"
                      ? "载入案例会替换当前访谈、确认字段与设计进度，此操作无法撤销。"
                      : `当前已有 ${recognizedFields} 项确认需求。清空后无法恢复本轮会话，请确认是否需要先导出台账。`}
                </p>
              </div>
              <div className="confirmation-dialog__actions">
                <button
                  ref={destructiveCancelRef}
                  type="button"
                  className="secondary-button"
                  onClick={dismissPendingProjectAction}
                >
                  保留当前方案
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={confirmPendingProjectAction}
                >
                  {pendingProjectAction.kind === "mode"
                    ? "切换并新建"
                    : pendingProjectAction.kind === "demo"
                      ? "载入案例"
                      : "清空并新建"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <CheckCircle2 size={17} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PromptPack({
  prompts,
  activeId,
  onActiveChange,
  onCopy,
  onDownload,
  idPrefix,
}: {
  prompts: PromptVariant[];
  activeId: PromptVariantId;
  onActiveChange: (id: PromptVariantId) => void;
  onCopy: (text: string, successMessage: string) => Promise<void>;
  onDownload?: () => void;
  idPrefix: string;
}) {
  const active = prompts.find((prompt) => prompt.id === activeId) ?? prompts[0];
  const allPrompts = prompts
    .map(
      (prompt) =>
        `## ${prompt.label} · ${prompt.purpose}\n\n${prompt.prompt}`,
    )
    .join("\n\n");
  const movePromptTab = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? prompts.length - 1
          : event.key === "ArrowRight"
            ? (currentIndex + 1) % prompts.length
            : (currentIndex - 1 + prompts.length) % prompts.length;
    const next = prompts[nextIndex];
    onActiveChange(next.id);
    window.setTimeout(() => {
      document.getElementById(`${idPrefix}-tab-${next.id}`)?.focus();
    }, 0);
  };

  return (
    <div className="prompt-pack">
      <div className="prompt-pack__tabs" role="tablist" aria-label="视觉提示词类型">
        {prompts.map((prompt, index) => (
          <button
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${prompt.id}`}
            aria-controls={`${idPrefix}-panel-${prompt.id}`}
            aria-selected={active.id === prompt.id}
            tabIndex={active.id === prompt.id ? 0 : -1}
            className={cx(active.id === prompt.id && "active")}
            key={prompt.id}
            onClick={() => onActiveChange(prompt.id)}
            onKeyDown={(event) => movePromptTab(event, index)}
          >
            <strong>{prompt.label}</strong>
            <small>{prompt.purpose}</small>
          </button>
        ))}
      </div>
      <div
        className="prompt-pack__panel"
        id={`${idPrefix}-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${active.id}`}
      >
        <div className="prompt-pack__meta">
          <strong>{active.label}</strong>
          <span>{active.prompt.length} 字符</span>
        </div>
        <pre>{active.prompt}</pre>
      </div>
      <div className="prompt-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => void onCopy(active.prompt, `${active.label}提示词已复制。`)}
        >
          <Copy size={15} />
          复制当前
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void onCopy(allPrompts, "三套视觉提示词已复制。")}
        >
          <Copy size={15} />
          复制三套
        </button>
        {onDownload && (
          <button
            type="button"
            className="secondary-button"
            onClick={onDownload}
          >
            <FileDown size={15} />
            导出台账
          </button>
        )}
      </div>
    </div>
  );
}

function SideRail({
  activeStage,
  maxStageIndex,
  onOpenStage,
  recognizedFields,
  projectName,
  workMode,
}: {
  activeStage: StageId;
  maxStageIndex: number;
  onOpenStage: (index: number) => void;
  recognizedFields: number;
  projectName: string;
  workMode: WorkMode;
}) {
  const currentIndex = stageIndex(activeStage);

  return (
    <aside className="side-rail" aria-label="定制项目流程">
      <div className="brand-block">
        <Seal />
        <div>
          <strong>海上衣笺</strong>
          <span>HAISHANG YIJIAN</span>
        </div>
      </div>

      <div className="rail-project">
        <span>当前方案</span>
        <strong>{projectName}</strong>
        <small>
          {workMode === "private" ? "私定" : "职服"} · {recognizedFields}/
          {BRIEF_FIELDS.length}
        </small>
      </div>

      <nav className="rail-steps" aria-label="设计阶段">
        {STAGES.map((stage, index) => {
          const active = stage.id === activeStage;
          const unlocked = index <= maxStageIndex;
          const completed = index < currentIndex;
          const Icon = stage.icon;
          return (
            <button
              type="button"
              key={stage.id}
              className={cx(
                "rail-step",
                active && "rail-step--active",
                completed && "rail-step--completed",
                !unlocked && "rail-step--locked",
              )}
              onClick={() => onOpenStage(index)}
              aria-current={active ? "step" : undefined}
              aria-disabled={!unlocked}
              disabled={!unlocked}
              title={stage.label}
            >
              <span className="rail-step__index">
                {!unlocked ? (
                  <LockKeyhole size={13} />
                ) : completed ? (
                  <Check size={14} />
                ) : (
                  `0${index + 1}`
                )}
              </span>
              <span className="rail-step__icon">
                <Icon size={17} />
              </span>
              <span className="rail-step__copy">
                <strong>{stage.short}</strong>
                <small>{stage.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <div
        className="rail-boundary"
        title="报价、定版与生产由上服顾问完成"
      >
        <LockKeyhole size={15} />
        <p>
          本工具用于定制需求整理与设计沟通。报价、定版与生产由上服顾问完成。
        </p>
      </div>
    </aside>
  );
}

function MobileStageStrip({
  activeStage,
  maxStageIndex,
  onOpenStage,
}: {
  activeStage: StageId;
  maxStageIndex: number;
  onOpenStage: (index: number) => void;
}) {
  return (
    <nav className="mobile-stages" aria-label="移动端设计阶段">
      {STAGES.map((stage, index) => (
        <button
          type="button"
          key={stage.id}
          className={cx(
            activeStage === stage.id && "active",
            index <= maxStageIndex
              ? "unlocked"
              : "locked",
          )}
          onClick={() => onOpenStage(index)}
          aria-current={activeStage === stage.id ? "step" : undefined}
          disabled={index > maxStageIndex}
        >
          <span>0{index + 1}</span>
          {stage.short}
        </button>
      ))}
    </nav>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="slider-field">
      <div className="slider-field__head">
        <label htmlFor={id}>{label}</label>
        <span>
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
      />
      <div className="slider-field__scale">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  optional = false,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="form-field">
      <span>
        {label}
        {optional && <small>选填</small>}
      </span>
      {children}
      {error && <em>{error}</em>}
    </label>
  );
}
