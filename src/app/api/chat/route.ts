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
  responseSchema?: unknown;
  responseStyle?: string;
  serviceTier?: string;
  tools?: {
    codeExecution?: boolean;
    fileSearch?: boolean;
    mapsGrounding?: boolean;
    urlContext?: boolean;
  };
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
        executableCode?: {
          language?: string;
          code?: string;
        };
        executable_code?: {
          language?: string;
          code?: string;
        };
        codeExecutionResult?: {
          outcome?: string;
          output?: string;
        };
        code_execution_result?: {
          outcome?: string;
          output?: string;
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
        maps?: {
          placeId?: string;
          title?: string;
          uri?: string;
        };
        retrievedContext?: {
          title?: string;
          uri?: string;
          text?: string;
        };
        retrieved_context?: {
          title?: string;
          uri?: string;
          text?: string;
        };
      }>;
    };
    urlContextMetadata?: {
      urlMetadata?: Array<{
        retrievedUrl?: string;
        urlRetrievalStatus?: string;
      }>;
    };
    url_context_metadata?: {
      url_metadata?: Array<{
        retrieved_url?: string;
        url_retrieval_status?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
  promptFeedback?: {
    blockReason?: string;
  };
  usageMetadata?: {
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
  usage_metadata?: {
    cached_content_token_count?: number;
    thoughts_token_count?: number;
    total_token_count?: number;
  };
};

type GeminiResponsePart = NonNullable<
  NonNullable<NonNullable<GeminiResponse["candidates"]>[number]["content"]>["parts"]
>[number];

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

const BASE_SYSTEM_PROMPT = [
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
  process.env.QUANTUM_GEMINI_IMAGE_MODEL?.trim() || "";

const FILE_SEARCH_STORE_NAMES = () =>
  (process.env.QUANTUM_GEMINI_FILE_SEARCH_STORES || "")
    .split(",")
    .map((store) => store.trim())
    .filter(Boolean);

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
          "Quantum is not connected to its AI service yet. Add server AI credentials to Quantum/.env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  const baseUrl = (
    process.env.GEMINI_API_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta"
  ).replace(/\/$/, "");
  const tier = resolveTier(body.model);
  const imageModel = IMAGE_MODEL();
  const wantsGeneratedImage =
    Boolean(imageModel) && shouldUseImageGeneration(message, body.attachments);
  const model = resolveModel(tier, wantsGeneratedImage);
  const publicModel = resolvePublicModelName(tier);
  const maxOutputTokens = Number(process.env.QUANTUM_MAX_OUTPUT_TOKENS || 2048);
  const serviceTier = resolveServiceTier(body.serviceTier);
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
      parts: [{ text: buildSystemPrompt(body.responseStyle, Boolean(imageModel)) }],
    },
    contents: [
      ...normalizeHistory(body.history),
      { role: "user" satisfies GeminiRole, parts: userParts },
    ],
    generationConfig: buildGenerationConfig({
      includeImageOutput: wantsGeneratedImage,
      maxOutputTokens,
      responseSchema: body.responseSchema,
      tier,
    }),
  };

  const toolConfig = buildGeminiToolConfig({
    attachments,
    message,
    request: body,
  });

  if (toolConfig.tools.length > 0) {
    payload.tools = toolConfig.tools;
  }

  if (toolConfig.toolConfig) {
    payload.toolConfig = toolConfig.toolConfig;
  }

  if (serviceTier !== "standard") {
    payload.service_tier = serviceTier;
  }

  const cachedContent = process.env.QUANTUM_GEMINI_CACHED_CONTENT?.trim();
  if (cachedContent) {
    payload.cachedContent = cachedContent;
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
      payload.generationConfig = buildGenerationConfig({
        includeImageOutput: wantsGeneratedImage,
        maxOutputTokens: 4096,
        responseSchema: body.responseSchema,
        tier,
      });
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
          metadata: buildResponseMetadata(data, toolConfig),
          model: publicModel,
          serviceTier,
          tier,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      createdAt: new Date().toISOString(),
      images,
      message: reply,
      metadata: buildResponseMetadata(data, toolConfig),
      model: publicModel,
      serviceTier,
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

function buildGenerationConfig({
  includeImageOutput = false,
  maxOutputTokens,
  responseSchema,
  tier,
}: {
  includeImageOutput?: boolean;
  maxOutputTokens: number;
  responseSchema?: unknown;
  tier: ModelTier;
}) {
  const config: Record<string, unknown> = {
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

  if (!includeImageOutput) {
    config.thinkingConfig = {
      thinkingBudget: resolveThinkingBudget(tier),
    };
  }

  if (isJsonObject(responseSchema)) {
    config.responseFormat = {
      text: {
        mimeType: "application/json",
        schema: responseSchema,
      },
    };
  }

  return config;
}

function resolveTier(value?: string): ModelTier {
  const normalized = value?.toLowerCase();
  return MODEL_TIERS.find((tier) => tier === normalized) || "pro";
}

function resolveServiceTier(value?: string) {
  const normalized = value?.toLowerCase();

  if (normalized === "flex" || normalized === "priority") return normalized;

  const configured = process.env.QUANTUM_GEMINI_SERVICE_TIER?.toLowerCase();
  return configured === "flex" || configured === "priority"
    ? configured
    : "standard";
}

function resolveThinkingBudget(tier: ModelTier) {
  const defaultBudgetByTier: Record<ModelTier, number> = {
    flash: 512,
    pro: 1024,
    ultra: 2048,
  };
  const configured = Number(
    process.env[`QUANTUM_GEMINI_THINKING_BUDGET_${tier.toUpperCase()}`] ||
      process.env.QUANTUM_GEMINI_THINKING_BUDGET,
  );

  return Number.isFinite(configured) && configured >= 0
    ? configured
    : defaultBudgetByTier[tier];
}

function buildGeminiToolConfig({
  attachments,
  message,
  request,
}: {
  attachments: ReturnType<typeof normalizeAttachments>;
  message: string;
  request: ChatRequest;
}) {
  const tools: Array<Record<string, unknown>> = [];
  const enabled: string[] = [];
  const skipped: string[] = [];
  const fileSearchStores = FILE_SEARCH_STORE_NAMES();
  const wantsFileSearch = Boolean(request.tools?.fileSearch);
  const hasAttachments = attachments.length > 0;

  if (wantsFileSearch) {
    if (fileSearchStores.length > 0) {
      return {
        enabled: ["fileSearch"],
        skipped,
        tools: [
          {
            file_search: {
              file_search_store_names: fileSearchStores,
            },
          },
        ],
        toolConfig: undefined,
      };
    }

    skipped.push("fileSearch:not_configured");
  }

  if (request.webSearch) {
    tools.push({ google_search: {} });
    enabled.push("searchGrounding");
  }

  if (request.tools?.urlContext !== false && hasPublicUrls(message)) {
    tools.push({ url_context: {} });
    enabled.push("urlContext");
  }

  if (request.tools?.codeExecution) {
    tools.push({ code_execution: {} });
    enabled.push("codeExecution");
  }

  if (request.tools?.mapsGrounding) {
    if (hasAttachments) {
      skipped.push("mapsGrounding:text_only");
    } else {
      tools.push({ googleMaps: {} });
      enabled.push("mapsGrounding");
    }
  }

  return { enabled, skipped, tools, toolConfig: undefined };
}

function hasPublicUrls(value: string) {
  return extractPublicUrls(value).length > 0;
}

function extractPublicUrls(value: string) {
  return Array.from(value.matchAll(/https?:\/\/[^\s<>"')]+/gi))
    .map((match) => match[0])
    .filter((url) => {
      try {
        const parsed = new URL(url);
        return !["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
      } catch {
        return false;
      }
    })
    .slice(0, 20);
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildSystemPrompt(responseStyle?: string, hasImageModel = false) {
  const normalized = responseStyle?.toLowerCase();
  const styleInstruction =
    normalized === "concise"
      ? "The user prefers concise answers: lead with the answer, avoid unnecessary background, and use compact bullets only when they help."
      : normalized === "detailed"
        ? "The user prefers detailed answers: include reasoning, tradeoffs, examples, and practical next steps when useful."
        : "The user prefers balanced answers: be clear and structured without over-explaining.";

  const mediaInstruction = hasImageModel
    ? "When image generation is available and the user requests it, create the requested visual and briefly explain the result."
    : "If the user asks for generated audio, live voice, or generated images, explain that Quantum can help plan or describe the asset but cannot directly create that media in this chat.";

  return `${BASE_SYSTEM_PROMPT}\n${styleInstruction}\n${mediaInstruction}`;
}

function resolveModel(tier: ModelTier, includeImageOutput = false) {
  const configuredModel = includeImageOutput ? IMAGE_MODEL() : MODEL_BY_TIER[tier]();
  return configuredModel.replace(/^models\//, "");
}

function resolvePublicModelName(tier: ModelTier) {
  const names: Record<ModelTier, string> = {
    flash: "Quantum Flash",
    pro: "Quantum Pro",
    ultra: "Quantum Ultra",
  };

  return names[tier];
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
        isSupportedInlineMimeType(attachment.mimeType) &&
        attachment.data.length > 0
      );
    })
    .slice(0, 6)
    .map((attachment) => ({
      data: String(attachment.data),
      mimeType: String(attachment.mimeType),
      name: typeof attachment.name === "string" ? attachment.name : undefined,
    }));
}

function isSupportedInlineMimeType(mimeType: string) {
  return (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("text/") ||
    [
      "application/json",
      "application/pdf",
      "application/sql",
      "application/typescript",
      "application/xml",
    ].includes(mimeType)
  );
}

function extractReply(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map(formatResponsePart)
      .join("")
      .trim() || ""
  );
}

function formatResponsePart(part: GeminiResponsePart) {
  if (part.text) return part.text;

  const executableCode = part.executableCode || part.executable_code;
  if (executableCode?.code) {
    const language = executableCode.language?.toLowerCase() === "python"
      ? "python"
      : "";
    return `\n\n\`\`\`${language}\n${executableCode.code.trim()}\n\`\`\`\n`;
  }

  const result = part.codeExecutionResult || part.code_execution_result;
  if (result?.output) {
    return `\n\n\`\`\`text\n${result.output.trim()}\n\`\`\`\n`;
  }

  return "";
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
  const links = collectSources(data).slice(0, 6);

  if (!reply || links.length === 0) return reply;

  const sources = links
    .map((link, index) => {
      const title = link.title.trim() || `Source ${index + 1}`;
      return `${index + 1}. [${title}](${link.uri})`;
    })
    .join("\n");

  return `${reply}\n\n### Sources\n${sources}`;
}

function collectSources(data: GeminiResponse) {
  const candidate = data.candidates?.[0];
  const sources: Array<{ title: string; uri: string; type: string }> = [];

  candidate?.groundingMetadata?.groundingChunks?.forEach((chunk) => {
    if (chunk.web?.uri) {
      sources.push({
        title: chunk.web.title || "Web source",
        type: "web",
        uri: chunk.web.uri,
      });
    }

    if (chunk.maps?.uri) {
      sources.push({
        title: chunk.maps.title || "Map result",
        type: "maps",
        uri: chunk.maps.uri,
      });
    }

    const retrievedContext = chunk.retrievedContext || chunk.retrieved_context;
    if (retrievedContext?.uri) {
      sources.push({
        title: retrievedContext.title || "Knowledge source",
        type: "fileSearch",
        uri: retrievedContext.uri,
      });
    }
  });

  const urlMetadata =
    candidate?.urlContextMetadata?.urlMetadata ||
    candidate?.url_context_metadata?.url_metadata ||
    [];

  urlMetadata.forEach((metadata) => {
    const record = metadata as Record<string, string | undefined>;
    const uri = record.retrievedUrl || record.retrieved_url;
    const status = record.urlRetrievalStatus || record.url_retrieval_status;

    if (uri && (!status || status.endsWith("_SUCCESS"))) {
      sources.push({
        title: readableUrlTitle(uri),
        type: "url",
        uri,
      });
    }
  });

  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.uri)) return false;
    seen.add(source.uri);
    return true;
  });
}

function readableUrlTitle(uri: string) {
  try {
    const url = new URL(uri);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "URL context";
  }
}

function buildResponseMetadata(
  data: GeminiResponse,
  toolConfig: ReturnType<typeof buildGeminiToolConfig>,
) {
  const usage = data.usageMetadata || data.usage_metadata;
  const usageRecord = usage as Record<string, number | undefined> | undefined;

  return {
    sources: collectSources(data),
    tools: {
      enabled: toolConfig.enabled,
      skipped: toolConfig.skipped,
    },
    usage: usageRecord
      ? {
          cachedContentTokenCount:
            usageRecord.cachedContentTokenCount ||
            usageRecord.cached_content_token_count ||
            0,
          thoughtsTokenCount:
            usageRecord.thoughtsTokenCount ||
            usageRecord.thoughts_token_count ||
            0,
          totalTokenCount:
            usageRecord.totalTokenCount || usageRecord.total_token_count || 0,
        }
      : undefined,
  };
}
