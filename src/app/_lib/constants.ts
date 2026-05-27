import type { ChatPreferences, ResponseStyle } from "./types";

export const MAX_IMAGE_ATTACHMENTS = 4;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefuinc.com";
const CHEFU_ACCOUNT_URL =
  process.env.NEXT_PUBLIC_CHEFU_ACCOUNT_URL || "https://myaccount.chefuinc.com";
const QUANTUM_APP_URL =
  process.env.NEXT_PUBLIC_QUANTUM_APP_URL || "https://quantum.chefuinc.com";

export const CHEFU_ACCOUNT_BASE = CHEFU_ACCOUNT_URL.replace(/\/$/, "");
export const CHEFU_LOGIN_HREF = `${CHEFU_ACCOUNT_BASE}/login?app=quantum&returnTo=${encodeURIComponent(QUANTUM_APP_URL)}`;
export const CHEFU_ACCOUNT_MANAGE_HREF = `${CHEFU_ACCOUNT_BASE}/account`;

export function buildChefuLogoutHref(returnTo = QUANTUM_APP_URL) {
  return `${CHEFU_ACCOUNT_BASE}/logout?app=quantum&returnTo=${encodeURIComponent(returnTo)}`;
}

export const MODELS = [
  {
    id: "flash",
    name: "Quantum Flash",
    badge: "Fast",
    color: "#81c995",
    description: "Quick drafts, summaries, and everyday questions.",
  },
  {
    id: "pro",
    name: "Quantum Pro",
    badge: "Balanced",
    color: "#8ab4f8",
    description: "General work with stronger reasoning and polish.",
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
  enterToSend: true,
  responseStyle: "balanced",
  saveConversations: true,
  showTimestamps: true,
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
