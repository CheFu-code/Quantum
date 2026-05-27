import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GeminiRole = "user" | "model";

type ChatRequest = {
  attachments?: Array<{
    data?: string;
    mimeType?: string;
    name?: string;
    size?: number;
  }>;
  history?: Array<{ role?: string; content?: string }>;
  message?: string;
  model?: string;
  webSearch?: boolean;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
        inline_data?: {
          mime_type?: string;
          data?: string;
        };
      }>;
    };
    finishReason?: string;
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: {
          title?: string;
          uri?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
  promptFeedback?: {
    blockReason?: string;
  };
};

type GeneratedImage = {
  id: string;
  mimeType: string;
  data: string;
  alt: string;
};

type GeminiPart =
  | { text: string }
  | {
      inline_data: {
        mime_type: string;
        data: string;
      };
    };

const MODEL_TIERS = ["flash", "pro", "ultra"] as const;
type ModelTier = (typeof MODEL_TIERS)[number];

const SYSTEM_PROMPT = [
  "You are Quantum, a polished AI assistant for focused work.",
  "Give clear, useful answers with enough structure to help the user act.",
  "Be concise by default, but expand when the user asks for depth.",
  "If the user asks for code, provide practical implementation guidance and note important caveats.",
].join(" ");

const MODEL_BY_TIER: Record<ModelTier, () => string> = {
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

const IMAGE_MODEL = () =>
  process.env.QUANTUM_GEMINI_IMAGE_MODEL ||
  "gemini-3.1-flash-image-preview";

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
  const tier = resolveTier(body.model);
  const wantsGeneratedImage = shouldUseImageGeneration(message, body.attachments);
  const model = resolveModel(tier, wantsGeneratedImage);
  const maxOutputTokens = Number(process.env.QUANTUM_MAX_OUTPUT_TOKENS || 2048);
  const attachments = normalizeAttachments(body.attachments);
  const userParts: GeminiPart[] = [
    { text: message },
    ...attachments.map((attachment): GeminiPart => ({
      inline_data: {
        mime_type: attachment.mimeType,
        data: attachment.data,
      },
    })),
  ];

  const payload: Record<string, unknown> = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      ...normalizeHistory(body.history),
      { role: "user" satisfies GeminiRole, parts: userParts },
    ],
    generationConfig: buildGenerationConfig(maxOutputTokens, wantsGeneratedImage),
  };

  if (body.webSearch) {
    payload.tools = [{ google_search: {} }];
  }

  try {
    let { response, data } = await requestGemini(baseUrl, model, apiKey, payload);

    if (!response.ok) {
      const detail = data.error?.message || response.statusText;
      return NextResponse.json(
        { error: `Quantum error: ${detail}` },
        { status: response.status },
      );
    }

    let images = extractGeneratedImages(data, message);
    let reply = withGroundingLinks(extractReply(data), data);
    if (!reply && data.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      payload.generationConfig = buildGenerationConfig(4096, wantsGeneratedImage);
      ({ response, data } = await requestGemini(baseUrl, model, apiKey, payload));

      if (!response.ok) {
        const detail = data.error?.message || response.statusText;
        return NextResponse.json(
          { error: `Quantum error: ${detail}` },
          { status: response.status },
        );
      }

      images = extractGeneratedImages(data, message);
      reply = withGroundingLinks(extractReply(data), data);
    }

    if (!reply && images.length > 0) {
      reply = images.length === 1
        ? "Here is the image I generated."
        : `Here are the ${images.length} images I generated.`;
    }

    if (!reply) {
      return NextResponse.json(
        {
          createdAt: new Date().toISOString(),
          message: buildEmptyResponseMessage(data),
          images,
          model,
          tier,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      createdAt: new Date().toISOString(),
      images,
      message: reply,
      model,
      tier,
    });
  } catch (error) {
    console.error("Quantum request failed:", error);
    return NextResponse.json(
      { error: "Quantum could not reach the server. Please try again." },
      { status: 502 },
    );
  }
}

async function requestGemini(
  baseUrl: string,
  model: string,
  apiKey: string,
  payload: Record<string, unknown>,
) {
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

  return { response, data };
}

function buildGenerationConfig(maxOutputTokens: number, includeImageOutput = false) {
  return {
    maxOutputTokens:
      Number.isFinite(maxOutputTokens) && maxOutputTokens > 0
        ? maxOutputTokens
        : 2048,
    ...(includeImageOutput
      ? {
          responseModalities: ["TEXT", "IMAGE"],
        }
      : {}),
  };
}

function resolveTier(value?: string): ModelTier {
  const normalized = value?.toLowerCase();
  return MODEL_TIERS.find((tier) => tier === normalized) || "pro";
}

function resolveModel(tier: ModelTier, includeImageOutput = false) {
  const configuredModel = includeImageOutput ? IMAGE_MODEL() : MODEL_BY_TIER[tier]();
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

function normalizeAttachments(attachments?: ChatRequest["attachments"]) {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter((attachment) => {
      return (
        typeof attachment.data === "string" &&
        typeof attachment.mimeType === "string" &&
        attachment.mimeType.startsWith("image/") &&
        attachment.data.length > 0
      );
    })
    .slice(0, 4)
    .map((attachment) => ({
      data: String(attachment.data),
      mimeType: String(attachment.mimeType),
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

function extractGeneratedImages(data: GeminiResponse, prompt: string): GeneratedImage[] {
  const parts = data.candidates?.[0]?.content?.parts || [];

  return parts
    .map((part, index) => {
      const inlineData = part.inlineData || (
        part.inline_data
          ? {
              mimeType: part.inline_data.mime_type,
              data: part.inline_data.data,
            }
          : undefined
      );

      if (
        !inlineData?.data ||
        !inlineData.mimeType?.startsWith("image/")
      ) {
        return null;
      }

      return {
        id: `generated-image-${index}`,
        mimeType: inlineData.mimeType,
        data: inlineData.data,
        alt: buildImageAlt(prompt, index),
      };
    })
    .filter((image): image is GeneratedImage => Boolean(image));
}

function shouldUseImageGeneration(
  message: string,
  attachments?: ChatRequest["attachments"],
) {
  const normalized = message.toLowerCase();
  const hasImageInput = Array.isArray(attachments) && attachments.length > 0;
  const imageOutputWords =
    /\b(generate|create|draw|make|design|render|illustrate|visualize|paint|edit|turn|transform)\b/.test(
      normalized,
    ) &&
    /\b(image|picture|photo|logo|icon|illustration|poster|wallpaper|render|art|sketch|drawing|infographic)\b/.test(
      normalized,
    );

  return imageOutputWords || (hasImageInput && /\b(edit|change|turn|transform|add|remove|replace)\b/.test(normalized));
}

function buildImageAlt(prompt: string, index: number) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  const summary = normalized.length > 90
    ? `${normalized.slice(0, 87)}...`
    : normalized;

  return summary
    ? `Generated image ${index + 1}: ${summary}`
    : `Generated image ${index + 1}`;
}

function buildEmptyResponseMessage(data: GeminiResponse) {
  const finishReason = data.candidates?.[0]?.finishReason;
  const blockReason = data.promptFeedback?.blockReason;

  if (blockReason) {
    return `I could not answer that because the model blocked the request (${blockReason}). Try rephrasing it with a little more context.`;
  }

  if (finishReason === "MAX_TOKENS") {
    return "I started working on that, but the response ran out of output budget before I could produce a visible answer. Try a shorter prompt or switch to Quantum Flash.";
  }

  if (finishReason) {
    return `I could not produce a visible answer for that request (${finishReason}). Try rephrasing it and I will take another pass.`;
  }

  return "I could not produce a visible answer for that request. Try rephrasing it and I will take another pass.";
}

function withGroundingLinks(reply: string, data: GeminiResponse) {
  const links =
    data.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk) => chunk.web)
      .filter((web): web is { title?: string; uri: string } =>
        Boolean(web?.uri),
      )
      .slice(0, 5) || [];

  if (!reply || links.length === 0) return reply;

  const sources = links
    .map((link, index) => {
      const title = link.title?.trim() || `Source ${index + 1}`;
      return `${index + 1}. [${title}](${link.uri})`;
    })
    .join("\n");

  return `${reply}\n\n### Sources\n${sources}`;
}
