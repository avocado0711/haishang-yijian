import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    llmConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
    imageApiConfigured: Boolean(
      process.env.IMAGE_API_KEY && process.env.IMAGE_API_BASE_URL,
    ),
    defaultLlmModel: "deepseek-flash",
  });
}
