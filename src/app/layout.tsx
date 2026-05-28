import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import { WebMCPProvider } from "./_components/WebMCPProvider";
import { siteDescription, siteName, siteUrl } from "./site-metadata";
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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Quantum | CheFu AI Assistant",
    template: "%s | Quantum",
  },
  description: siteDescription,
  applicationName: siteName,
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
    description: siteDescription,
    url: "/",
    siteName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quantum | CheFu AI Assistant",
    description: siteDescription,
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
      <body>
        <WebMCPProvider />
        {children}
      </body>
    </html>
  );
}
