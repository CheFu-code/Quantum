import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GeminiRole = "user" | "model";

type ChatRequest = {
  history?: Array<{ role?: string; content?: string }>;
  message?: string;
  model?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const SYSTEM_PROMPT = [
  "You are Quantum, a polished AI assistant for focused work.",
  "Give clear, useful answers with enough structure to help the user act.",
  "Be concise by default, but expand when the user asks for depth.",
  "If the user asks for code, provide practical implementation guidance and note important caveats.",
].join(" ");

const MODEL_BY_TIER: Record<string, () => string> = {
  flash: () =>
    process.env.QUANTUM_GEMINI_MODEL_FLASH ||
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash",
  pro: () =>
    process.env.QUANTUM_GEMINI_MODEL_PRO ||
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash",
  ultra: () =>
    process.env.QUANTUM_GEMINI_MODEL_ULTRA ||
    process.env.GEMINI_MODEL ||
    "gemini-2.5-pro",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChatRequest;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json(
      { error: "A message is required." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Quantum is not connected to Gemini yet. Add GEMINI_API_KEY to Quantum/.env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  const baseUrl = (
    process.env.GEMINI_API_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta"
  ).replace(/\/$/, "");
  const model = resolveModel(body.model);
  const maxOutputTokens = Number(process.env.QUANTUM_MAX_OUTPUT_TOKENS || 1200);

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      ...normalizeHistory(body.history),
      { role: "user" satisfies GeminiRole, parts: [{ text: message }] },
    ],
    generationConfig: {
      maxOutputTokens:
        Number.isFinite(maxOutputTokens) && maxOutputTokens > 0
          ? maxOutputTokens
          : 1200,
    },
  };

  try {
    const response = await fetch(
      `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json().catch(() => ({}))) as GeminiResponse;

    if (!response.ok) {
      const detail = data.error?.message || response.statusText;
      return NextResponse.json(
        { error: `Quantum error: ${detail}` },
        { status: response.status },
      );
    }

    const reply = extractReply(data);
    if (!reply) {
      return NextResponse.json(
        { error: "Quantum returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      createdAt: new Date().toISOString(),
      message: reply,
      model,
    });
  } catch (error) {
    console.error("Quantum Gemini request failed:", error);
    return NextResponse.json(
      { error: "Quantum could not reach the server. Please try again." },
      { status: 502 },
    );
  }
}

function resolveModel(tier?: string) {
  const normalizedTier = tier?.toLowerCase() || "pro";
  const configuredModel = (MODEL_BY_TIER[normalizedTier] || MODEL_BY_TIER.pro)();

  return configuredModel.replace(/^models\//, "");
}

function normalizeHistory(history?: ChatRequest["history"]) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item) => {
      return (
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
      );
    })
    .slice(-12)
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content?.trim() || "" }],
    }));
}

function extractReply(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}
