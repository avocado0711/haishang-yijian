import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  Noto_Sans_SC,
  Noto_Serif_SC,
} from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import "./redesign.css";

const sans = Noto_Sans_SC({
  variable: "--font-sans",
  weight: "variable",
  display: "swap",
  preload: false,
});

const serif = Noto_Serif_SC({
  variable: "--font-serif",
  weight: ["500", "600"],
  display: "swap",
  preload: false,
});

const condensed = Barlow_Condensed({
  variable: "--font-condensed",
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "海上衣笺 | 上服定制业务协作台",
  description:
    "面向上服集团定制业务专员、职业服方案设计师与企划人员的 AI 需求解构、资源匹配、视觉提示词和业务台账协作台。",
  applicationName: "海上衣笺",
  icons: {
    icon: "/favicon.svg",
  },
  keywords: ["海派定制", "AI 业务辅助", "职业服方案", "服装设计", "上海服装集团"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080b18",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${sans.variable} ${serif.variable} ${condensed.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
