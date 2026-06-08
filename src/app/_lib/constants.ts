import type { ChatPreferences, ResponseStyle, ServiceTier } from "./types";

export const MAX_IMAGE_ATTACHMENTS = 4;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS = 6;
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const SUPPORTED_ATTACHMENT_ACCEPT = [
  "image/*",
  "application/pdf",
  "text/*",
  ".csv",
  ".json",
  ".md",
  ".markdown",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".sql",
].join(",");

const SUPPORTED_ATTACHMENT_EXTENSIONS = new Set([
  "csv",
  "json",
  "md",
  "markdown",
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "sql",
  "txt",
]);

const SUPPORTED_ATTACHMENT_MIME_TYPES = new Set([
  "application/json",
  "application/pdf",
  "application/sql",
  "application/typescript",
  "application/xml",
  "text/csv",
  "text/javascript",
  "text/jsx",
  "text/markdown",
  "text/plain",
  "text/tab-separated-values",
  "text/tsx",
  "text/typescript",
  "text/x-python",
  "text/x-sql",
  "text/xml",
  "text/yaml",
]);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefuinc.com";
const CHEFU_ACCOUNT_URL =
  process.env.NEXT_PUBLIC_CHEFU_ACCOUNT_URL || "https://myaccount.chefuinc.com";
const QUANTUM_APP_URL =
  process.env.NEXT_PUBLIC_QUANTUM_APP_URL || "https://quantum.chefuinc.com";
const QUANTUM_MOBILE_SCHEME =
  process.env.NEXT_PUBLIC_QUANTUM_MOBILE_SCHEME || "quantum";
const QUANTUM_ANDROID_PACKAGE =
  process.env.NEXT_PUBLIC_QUANTUM_ANDROID_PACKAGE || "com.chefuinc.quantum";

export const CHEFU_ACCOUNT_BASE = CHEFU_ACCOUNT_URL.replace(/\/$/, "");
export const CHEFU_LOGIN_HREF = `${CHEFU_ACCOUNT_BASE}/login?app=quantum&returnTo=${encodeURIComponent(QUANTUM_APP_URL)}`;
export const CHEFU_ACCOUNT_MANAGE_HREF = `${CHEFU_ACCOUNT_BASE}/account`;
export const QUANTUM_WEB_HREF = QUANTUM_APP_URL.replace(/\/$/, "");
export const QUANTUM_MOBILE_DEEP_LINK = `${QUANTUM_MOBILE_SCHEME}://`;

export function buildChefuLogoutHref(returnTo = QUANTUM_APP_URL) {
  return `${CHEFU_ACCOUNT_BASE}/logout?app=quantum&returnTo=${encodeURIComponent(returnTo)}`;
}

export function buildQuantumMobileLaunchHref({
  fallbackUrl,
  platform,
}: {
  fallbackUrl: string;
  platform: "android" | "ios" | "other";
}) {
  if (platform === "android") {
    return `intent:///#Intent;scheme=${QUANTUM_MOBILE_SCHEME};package=${QUANTUM_ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
  }

  return QUANTUM_MOBILE_DEEP_LINK;
}

export const MODELS = [
  {
    id: "flash",
    name: "Quantum Flash",
    badge: "Fast",
    color: "#81c995",
    description: "Fast answers for focused everyday work.",
  },
  {
    id: "pro",
    name: "Quantum Pro",
    badge: "Balanced",
    color: "#8ab4f8",
    description: "Balanced reasoning, research, and polish.",
  },
  {
    id: "ultra",
    name: "Quantum Ultra",
    badge: "Deep",
    color: "#c58af9",
    description: "Harder analysis, coding, and multi-step tasks.",
  },
] as const;

export type QuantumModel = (typeof MODELS)[number];

export const QUANTUM_MODEL_CAPABILITIES = [
  "Thinking",
  "Search grounding",
  "URL context",
  "Code execution",
  "File search",
  "Function calling",
  "Structured outputs",
  "Google Maps grounding",
  "Caching",
  "Batch API",
  "Flex inference",
  "Priority inference",
] as const;

export const QUANTUM_TOOL_CAPABILITIES = [
  {
    id: "webSearch",
    label: "Search grounding",
    description: "Ground answers in current Google Search results.",
  },
  {
    id: "urlContext",
    label: "URL context",
    description: "Read public URLs that appear in the prompt.",
  },
  {
    id: "codeExecution",
    label: "Code execution",
    description: "Run Python for math, data, and verification tasks.",
  },
  {
    id: "mapsGrounding",
    label: "Maps grounding",
    description: "Use Google Maps context for places and local planning.",
  },
  {
    id: "fileSearch",
    label: "File search",
    description: "Search configured knowledge stores.",
  },
] as const;

export const INFERENCE_TIERS: Array<{
  id: ServiceTier;
  label: string;
  description: string;
}> = [
  {
    id: "standard",
    label: "Standard",
    description: "Default routing for interactive chat.",
  },
  {
    id: "flex",
    label: "Flex",
    description: "Lower-cost best-effort routing for latency-tolerant work.",
  },
  {
    id: "priority",
    label: "Priority",
    description: "Premium routing for business-critical requests.",
  },
];

export const VOICE_LANGUAGES = [
  { id: "auto", label: "Auto" },
  { id: "en-US", label: "English US" },
  { id: "en-GB", label: "English UK" },
  { id: "es-ES", label: "Spanish" },
  { id: "fr-FR", label: "French" },
  { id: "pt-PT", label: "Portuguese" },
  { id: "zu-ZA", label: "Zulu" },
] as const;

export const RESPONSE_STYLES: Array<{
  id: ResponseStyle;
  label: string;
  description: string;
}> = [
  {
    id: "concise",
    label: "Concise",
    description: "Short answers with the main point first.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Helpful structure with enough detail for most work.",
  },
  {
    id: "detailed",
    label: "Detailed",
    description: "Longer explanations, tradeoffs, and examples.",
  },
];

export const DEFAULT_CHAT_PREFERENCES: ChatPreferences = {
  autoScroll: true,
  compactMessages: false,
  codeExecution: false,
  enterToSend: true,
  fileSearch: false,
  mapsGrounding: false,
  responseStyle: "balanced",
  saveConversations: true,
  serviceTier: "standard",
  showTimestamps: true,
  urlContext: true,
};

export function apiUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

export function resolveStoredModel(value: string | null): QuantumModel {
  return MODELS.find((model) => model.id === value) || MODELS[1];
}

export function resolveResponseStyle(value: unknown): ResponseStyle {
  return RESPONSE_STYLES.some((style) => style.id === value)
    ? (value as ResponseStyle)
    : DEFAULT_CHAT_PREFERENCES.responseStyle;
}

export function resolveServiceTier(value: unknown): ServiceTier {
  return INFERENCE_TIERS.some((tier) => tier.id === value)
    ? (value as ServiceTier)
    : DEFAULT_CHAT_PREFERENCES.serviceTier;
}

export function isSupportedAttachmentFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  if (file.type.startsWith("text/")) return true;
  if (SUPPORTED_ATTACHMENT_MIME_TYPES.has(file.type)) return true;

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? SUPPORTED_ATTACHMENT_EXTENSIONS.has(extension) : false;
}
