import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import "../styles/index.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_QUANTUM_APP_URL || "https://quantum.chefuinc.com",
  ),
  title: {
    default: "Quantum | CheFu AI Assistant",
    template: "%s | Quantum",
  },
  description:
    "Quantum is a fast, professional AI chat workspace from CheFu for focused research, coding, writing, and analysis.",
  applicationName: "Quantum",
  icons: {
    icon: [
      {
        url: "/quantum-logo.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/quantum-logo.svg",
  },
  keywords: [
    "Quantum",
    "CheFu",
    "AI assistant",
    "AI chatbot",
    "productivity",
    "research assistant",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Quantum | CheFu AI Assistant",
    description:
      "A fast, professional AI chat workspace for focused research, coding, writing, and analysis.",
    url: "/",
    siteName: "Quantum",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quantum | CheFu AI Assistant",
    description:
      "A fast, professional AI chat workspace for focused research, coding, writing, and analysis.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0f14",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body>{children}</body>
    </html>
  );
}
