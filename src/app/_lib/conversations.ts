import { apiUrl } from "./constants";
import type { ChatThread, StoredThread } from "./types";

const STORAGE_KEY = "quantum-chat-threads";

export function formatTime(date: Date) {
  const diff = Date.now() - date.getTime();
  if (diff < 1000 * 60) return "Just now";
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
  return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ago`;
}

export function createId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomId}`;
}

export function threadTitle(input: string) {
  const words = input
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 7)
    .join(" ");

  if (!words) return "New conversation";
  return words.length > 46 ? `${words.slice(0, 43)}...` : words;
}

export function previewText(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();
  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized;
}

export function sortThreads(threads: ChatThread[]) {
  return [...threads].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function parseStoredThreads(value: string | null): ChatThread[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as StoredThread[];
    if (!Array.isArray(parsed)) return [];

    return sortThreads(
      parsed
        .filter((thread) => thread.id && Array.isArray(thread.messages))
        .map((thread) => ({
          ...thread,
          timestamp: new Date(thread.timestamp),
          messages: thread.messages.map((message) => ({
            ...message,
            timestamp: new Date(message.timestamp),
          })),
        })),
    );
  } catch {
    return [];
  }
}

export function toStoredThreads(threads: ChatThread[]) {
  return threads.map((thread): StoredThread => ({
    ...thread,
    timestamp: thread.timestamp.toISOString(),
    messages: thread.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    })),
  }));
}

export function sessionHeaders() {
  return {
    "x-chefu-app": "quantum",
  };
}

export function clearLocalConversationStorage() {
  Object.keys(window.localStorage)
    .filter((key) => key === STORAGE_KEY || key.startsWith(`${STORAGE_KEY}:`))
    .forEach((key) => window.localStorage.removeItem(key));
}

export async function loadSavedConversations() {
  const response = await fetch(apiUrl("/quantum/conversations"), {
    credentials: "include",
    headers: sessionHeaders(),
  });

  if (!response.ok) {
    throw new Error("Could not load saved conversations.");
  }

  const data = (await response.json().catch(() => null)) as {
    conversations?: StoredThread[];
  } | null;

  return parseStoredThreads(JSON.stringify(data?.conversations || []));
}

export async function saveSavedConversations(threads: ChatThread[]) {
  const response = await fetch(apiUrl("/quantum/conversations"), {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...sessionHeaders(),
    },
    body: JSON.stringify({
      conversations: toStoredThreads(threads),
    }),
  });

  if (!response.ok) {
    throw new Error("Could not save conversations.");
  }
}
