import { StudioApp } from "@/components/studio-app";
import type { LlmModel } from "@/lib/types";

export default function Home() {
  const defaultLlmModel: LlmModel =
    process.env.DEEPSEEK_DEFAULT_MODEL === "deepseek-v4-pro"
      ? "deepseek-v4-pro"
      : "deepseek-flash";

  return (
    <StudioApp
      runtime={{
        llmConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
        imageApiConfigured: Boolean(
          process.env.IMAGE_API_KEY && process.env.IMAGE_API_BASE_URL,
        ),
        defaultLlmModel,
      }}
    />
  );
}
