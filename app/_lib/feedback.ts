import type {
  MessageFeedbackRating,
  StoredMessageFeedback,
} from "./types";

const FEEDBACK_STORAGE_KEY = "quantum-message-feedback";

export type MessageFeedbackInput = {
  comment?: string;
  messageId: string;
  modelId: string;
  promptLength: number;
  rating: MessageFeedbackRating;
  requestId?: string;
  threadId: string;
  toolsUsed: string[];
  userId?: string;
};

export function loadStoredFeedback() {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(FEEDBACK_STORAGE_KEY) || "[]",
    ) as StoredMessageFeedback[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function feedbackByMessageId() {
  return new Map(
    loadStoredFeedback().map((feedback) => [
      feedback.messageId,
      feedback.rating,
    ]),
  );
}

export function saveMessageFeedback(input: MessageFeedbackInput) {
  const feedback: StoredMessageFeedback = {
    ...input,
    createdAt: new Date().toISOString(),
    id: createFeedbackId(),
  };
  const existing = loadStoredFeedback().filter(
    (item) => item.messageId !== input.messageId,
  );

  window.localStorage.setItem(
    FEEDBACK_STORAGE_KEY,
    JSON.stringify([feedback, ...existing].slice(0, 500)),
  );

  return feedback;
}

function createFeedbackId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
