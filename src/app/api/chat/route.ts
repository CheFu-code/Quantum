import { NextResponse } from "next/server";
import { checkRateLimit } from "../../_lib/rateLimit";
import { checkQuantumUsageLimit } from "../../_lib/usageLimit";

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

type ToolActivity = {
  type: "search" | "code" | "tool";
  title: string;
  detail?: string;
  code?: string;
  output?: string;
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
  "Never expose internal tool calls, search function names, raw tool syntax, or background execution logs as if they are user-facing answer text.",
  "When tools are used, summarize the result naturally and let the application render tool activity and sources separately.",
  "Whenever users inquire about your name, identity, or origins, clearly identify yourself as Quantum, an AI assistant developed and trained by the CheFu Team.",
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

type QuantumIdentity = {
  authenticated: boolean;
  email?: string;
  error?: string;
  member: boolean;
  roles: string[];
  subject: string;
  userId?: string;
};

const CHEFU_API_BASE_URL = () =>
  (
    process.env.CHEFU_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api.chefuinc.com"
  ).replace(/\/$/, "");

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const startedAt = Date.now();
  const rateLimit = await checkRateLimit(request, {
    keyPrefix: "quantum-chat",
    limit: 30,
    windowMs: 60_000,
  });

  if (rateLimit.limited) {
    logChatEvent({
      event: "chat_rate_limited",
      latencyMs: Date.now() - startedAt,
      requestId,
    });
    return NextResponse.json(
      { error: "Too many chat requests. Please wait a moment and try again." },
      {
        headers: {
          ...rateLimit.headers,
          "x-request-id": requestId,
        },
        status: 429,
      },
    );
  }

  const body = (await request.json().catch(() => ({}))) as ChatRequest;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json(
      { error: "A message is required." },
      { headers: { "x-request-id": requestId }, status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Quantum is not connected to its AI service yet. Add server AI credentials to Quantum/.env.local and restart the dev server.",
      },
      { headers: { "x-request-id": requestId }, status: 503 },
    );
  }

  const baseUrl = (
    process.env.GEMINI_API_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta"
  ).replace(/\/$/, "");
  const tier = resolveTier(body.model);
  const identity = await resolveQuantumIdentity(request);
  const serviceTier = resolveServiceTier(body.serviceTier);

  if (identity.error) {
    return NextResponse.json(
      { error: identity.error },
      { headers: { "x-request-id": requestId }, status: 401 },
    );
  }

  if (tier === "ultra" && !identity.authenticated) {
    return NextResponse.json(
      { error: "Sign in to use Quantum Ultra." },
      { headers: { "x-request-id": requestId }, status: 401 },
    );
  }

  if (serviceTier === "priority" && !hasPaidQuantumAccess(identity)) {
    return NextResponse.json(
      { error: "Priority inference requires an active paid CheFu account." },
      { headers: { "x-request-id": requestId }, status: 403 },
    );
  }

  const usageLimit = await checkQuantumUsageLimit(request, tier, identity.subject);

  if (usageLimit.limited) {
    logChatEvent({
      event: "chat_usage_limited",
      latencyMs: Date.now() - startedAt,
      requestId,
      tier,
    });
    return NextResponse.json(
      {
        error:
          "Quantum usage limit reached for this model tier. Please try again later or switch tiers.",
      },
      {
        headers: {
          ...usageLimit.headers,
          "x-request-id": requestId,
        },
        status: 429,
      },
    );
  }
  const imageModel = IMAGE_MODEL();
  const wantsGeneratedImage =
    Boolean(imageModel) && shouldUseImageGeneration(message, body.attachments);
  const model = resolveModel(tier, wantsGeneratedImage);
  const publicModel = resolvePublicModelName(tier);
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

  if (acceptsEventStream(request)) {
    return streamQuantumResponse({
      apiKey,
      baseUrl,
      headers: {
        ...rateLimit.headers,
        ...usageLimit.headers,
        "x-request-id": requestId,
      },
      message,
      model,
      payload,
      publicModel,
      requestId,
      startedAt,
      serviceTier,
      tier,
      toolConfig,
    });
  }

  try {
    let { response, data } = await requestGemini(baseUrl, model, apiKey, payload);

    if (!response.ok) {
      const detail = formatGeminiError(data.error?.message || response.statusText);
      return NextResponse.json(
        { error: `Quantum error: ${detail}` },
        {
          headers: { "x-request-id": requestId },
          status: response.status,
        },
      );
    }

    let images = extractGeneratedImages(data, message);
    let reply = extractReply(data);
    if (!reply && data.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      payload.generationConfig = buildGenerationConfig({
        includeImageOutput: wantsGeneratedImage,
        maxOutputTokens: 4096,
        responseSchema: body.responseSchema,
        tier,
      });
      ({ response, data } = await requestGemini(baseUrl, model, apiKey, payload));

      if (!response.ok) {
        const detail = formatGeminiError(data.error?.message || response.statusText);
        return NextResponse.json(
          { error: `Quantum error: ${detail}` },
          {
            headers: { "x-request-id": requestId },
            status: response.status,
          },
        );
      }

      images = extractGeneratedImages(data, message);
      reply = extractReply(data);
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
          metadata: buildResponseMetadata(data, toolConfig, {
            latencyMs: Date.now() - startedAt,
            model: publicModel,
            requestId,
          }),
          model: publicModel,
          serviceTier,
          tier,
        },
        {
          headers: {
            ...rateLimit.headers,
            ...usageLimit.headers,
            "x-request-id": requestId,
          },
          status: 200,
        },
      );
    }

    const metadata = buildResponseMetadata(data, toolConfig, {
      latencyMs: Date.now() - startedAt,
      model: publicModel,
      requestId,
    });

    logChatEvent({
      event: "chat_completed",
      latencyMs: Date.now() - startedAt,
      model: publicModel,
      requestId,
      sources: metadata.sources.length,
      tier,
      tools: toolConfig.enabled,
      totalTokens: metadata.usage?.totalTokenCount,
    });

    return NextResponse.json({
      createdAt: new Date().toISOString(),
      images,
      message: reply,
      metadata,
      model: publicModel,
      serviceTier,
      tier,
    }, {
      headers: {
        ...rateLimit.headers,
        ...usageLimit.headers,
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    logChatEvent({
      error: error instanceof Error ? error.message : "Unknown error",
      event: "chat_failed",
      latencyMs: Date.now() - startedAt,
      requestId,
      tier,
    });
    return NextResponse.json(
      { error: "Quantum could not reach the server. Please try again." },
      { headers: { "x-request-id": requestId }, status: 502 },
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

function acceptsEventStream(request: Request) {
  return request.headers
    .get("accept")
    ?.toLowerCase()
    .includes("text/event-stream");
}

async function requestGeminiStream(
  baseUrl: string,
  model: string,
  apiKey: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(
    `${baseUrl}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    },
  );

  return response;
}

function streamQuantumResponse({
  apiKey,
  baseUrl,
  headers,
  message,
  model,
  payload,
  publicModel,
  requestId,
  startedAt,
  serviceTier,
  tier,
  toolConfig,
}: {
  apiKey: string;
  baseUrl: string;
  headers: Record<string, string>;
  message: string;
  model: string;
  payload: Record<string, unknown>;
  publicModel: string;
  requestId: string;
  startedAt: number;
  serviceTier: string;
  tier: ModelTier;
  toolConfig: ReturnType<typeof buildGeminiToolConfig>;
}) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        const send = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        };

        try {
          const response = await requestGeminiStream(baseUrl, model, apiKey, payload);

          if (!response.ok) {
            send("error", {
              error: `Quantum error: ${await readGeminiError(response)}`,
            });
            controller.close();
            return;
          }

          const chunks: GeminiResponse[] = [];
          const activityKeys = new Set<string>();
          let reply = "";
          let images: GeneratedImage[] = [];

          await readGeminiEventStream(response, (data) => {
            chunks.push(data);

            collectToolActivities(data).forEach((activity) => {
              const key = activityKey(activity);
              if (activityKeys.has(key)) return;
              activityKeys.add(key);
              send("activity", { activity });
            });

            const text = extractReply(data, { trim: false });
            if (text) {
              reply += text;
              send("chunk", { text });
            }

            const nextImages = extractGeneratedImages(data, message);
            if (nextImages.length > 0) {
              images = [...images, ...nextImages];
            }
          });

          const finalData = chunks[chunks.length - 1] || {};
          const finalReply =
            reply.trim() ||
            (images.length > 0
              ? images.length === 1
                ? "Here is the image I generated."
                : `Here are the ${images.length} images I generated.`
              : buildEmptyResponseMessage(finalData));

          const latencyMs = Date.now() - startedAt;
          const metadata = buildResponseMetadata(chunks, toolConfig, {
            latencyMs,
            model: publicModel,
            requestId,
          });

          logChatEvent({
            event: "chat_stream_completed",
            latencyMs,
            model: publicModel,
            requestId,
            sources: metadata.sources.length,
            tier,
            tools: toolConfig.enabled,
            totalTokens: metadata.usage?.totalTokenCount,
          });

          send("done", {
            createdAt: new Date().toISOString(),
            images: normalizeGeneratedImages(images),
            message: finalReply,
            metadata,
            model: publicModel,
            serviceTier,
            tier,
          });
        } catch (error) {
          logChatEvent({
            error: error instanceof Error ? error.message : "Unknown error",
            event: "chat_stream_failed",
            latencyMs: Date.now() - startedAt,
            requestId,
            tier,
          });
          send("error", {
            error: "Quantum could not reach the server. Please try again.",
          });
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
        ...headers,
      },
    },
  );
}

async function readGeminiError(response: Response) {
  const data = (await response.json().catch(() => null)) as GeminiResponse | null;
  return formatGeminiError(data?.error?.message || response.statusText);
}

function formatGeminiError(message: string) {
  const detail = message.trim() || "The AI service returned an error.";
  const normalized = detail.toLowerCase();

  if (normalized.includes("dunning")) {
    const project = detail.match(/projects\/[\w-]+/)?.[0];
    const projectText = project ? ` (${project})` : "";

    return [
      `Gemini API access is blocked because the Google Cloud project linked to this API key is not in good billing standing${projectText}.`,
      "Update or re-enable Cloud Billing for that project, or replace GEMINI_API_KEY with a key from an active billing project, then restart Quantum.",
    ].join(" ");
  }

  return detail;
}

async function readGeminiEventStream(
  response: Response,
  onData: (data: GeminiResponse) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";
    events.forEach((event) => parseGeminiStreamEvent(event, onData));
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    parseGeminiStreamEvent(buffer, onData);
  }
}

function parseGeminiStreamEvent(
  event: string,
  onData: (data: GeminiResponse) => void,
) {
  const data = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();

  if (!data || data === "[DONE]") return;

  try {
    onData(JSON.parse(data) as GeminiResponse);
  } catch {
    console.warn("Ignored malformed Gemini stream event.");
  }
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

async function resolveQuantumIdentity(request: Request): Promise<QuantumIdentity> {
  const authorization = request.headers.get("authorization")?.trim();
  const cookie = request.headers.get("cookie")?.trim();
  const anonymous: QuantumIdentity = {
    authenticated: false,
    member: false,
    roles: [],
    subject: anonymousUsageSubject(request),
  };

  if (!authorization && !cookie) {
    return anonymous;
  }

  const headers: Record<string, string> = {
    "x-chefu-app": "quantum",
  };
  if (authorization) headers.Authorization = authorization;
  if (cookie) headers.Cookie = cookie;

  try {
    const response = await fetch(`${CHEFU_API_BASE_URL()}/auth/me`, {
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      return authorization
        ? {
            ...anonymous,
            error: "Your Quantum session has expired. Sign in again to continue.",
          }
        : anonymous;
    }

    const data = (await response.json().catch(() => null)) as
      | {
          profile?: {
            member?: boolean;
            subscriptionStatus?: string;
          };
          user?: {
            email?: string;
            roles?: string[];
            uid?: string;
          };
        }
      | null;
    const uid = data?.user?.uid?.trim();

    if (!uid) {
      return authorization
        ? {
            ...anonymous,
            error: "Your Quantum session could not be verified.",
          }
        : anonymous;
    }

    const roles = Array.isArray(data?.user?.roles)
      ? data.user.roles.map(String)
      : [];
    const subscriptionStatus =
      data?.profile?.subscriptionStatus?.trim().toLowerCase() || "";

    return {
      authenticated: true,
      email: data?.user?.email,
      member:
        data?.profile?.member === true ||
        ["active", "paid", "premium", "pro"].includes(subscriptionStatus),
      roles,
      subject: `user:${uid}`,
      userId: uid,
    };
  } catch {
    return authorization
      ? {
          ...anonymous,
          error: "Quantum could not verify your account session.",
        }
      : anonymous;
  }
}

function hasPaidQuantumAccess(identity: QuantumIdentity) {
  if (identity.member) return true;

  return identity.roles.some((role) =>
    ["admin", "owner", "premium", "pro"].includes(role.trim().toLowerCase()),
  );
}

function anonymousUsageSubject(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const realIp = request.headers.get("x-real-ip");
  return `anonymous:${(forwardedFor || realIp || "unknown").trim()}`;
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
      text: sanitizeHistoryContent(item.content?.trim() || ""),
    }))
    .filter((item) => item.text.length > 0)
    .map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    }));
}

function sanitizeHistoryContent(value: string) {
  return value
    .replace(/^```[\w-]*\n[\s\S]*?\n```\s*/g, "")
    .replace(/\n{2,}#{2,3}\s+Sources\s*\n[\s\S]+$/i, "")
    .replace(/\b(?:concise_search|google_search|web_search|search)\s*\([^)]*\)/gi, "")
    .replace(/Looking up information on Google Search\.?/gi, "")
    .trim();
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

function extractReply(data: GeminiResponse, options: { trim?: boolean } = {}) {
  const reply =
    data.candidates?.[0]?.content?.parts
      ?.map(formatResponsePart)
      .join("") || "";

  return options.trim === false ? reply : reply.trim();
}

function formatResponsePart(part: GeminiResponsePart) {
  if (part.text) return part.text;
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

function normalizeGeneratedImages(images: GeneratedImage[]) {
  const seen = new Set<string>();

  return images
    .filter((image) => {
      const key = `${image.mimeType}:${image.data.slice(0, 64)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((image, index) => ({
      ...image,
      id: `generated-image-${index}`,
    }));
}

function collectToolActivities(data: GeminiResponse): ToolActivity[] {
  const parts = data.candidates?.[0]?.content?.parts || [];
  const activities: ToolActivity[] = [];

  parts.forEach((part) => {
    const executableCode = part.executableCode || part.executable_code;
    if (executableCode?.code) {
      activities.push(activityFromCode(
        executableCode.language || "",
        executableCode.code,
      ));
      return;
    }

    const result = part.codeExecutionResult || part.code_execution_result;
    if (result?.output) {
      const output = result.output.trim();
      const latestActivity = activities[activities.length - 1];

      if (isSearchStatusOutput(output)) {
        return;
      }

      if (latestActivity && !latestActivity.output) {
        latestActivity.output = output;
        return;
      }

      const activity = activityFromToolOutput(output);
      if (activity) activities.push(activity);
    }
  });

  return activities;
}

function activityFromCode(language: string, code: string): ToolActivity {
  const normalizedCode = code.trim();
  const searchQuery = extractSearchQuery(normalizedCode);

  if (searchQuery) {
    return {
      type: "search",
      title: "Searched the web",
      detail: searchQuery,
      code: normalizedCode,
    };
  }

  return {
    type: "code",
    title: `Ran ${language.trim() || "code"}`,
    detail: normalizedCode.split("\n")[0]?.slice(0, 120),
    code: normalizedCode,
  };
}

function activityFromToolOutput(output: string): ToolActivity | null {
  if (isSearchStatusOutput(output)) return null;

  return {
    type: "tool",
    title: "Used a tool",
    detail: output.slice(0, 120),
    output,
  };
}

function isSearchStatusOutput(output: string) {
  return /^(looking up information on google search|searching (the )?(web|google search))\.?$/i.test(
    output.trim(),
  );
}

function extractSearchQuery(code: string) {
  const match = code.match(
    /\b(?:concise_search|google_search|web_search|search)\s*\(\s*["'`]([^"'`]+)["'`]/i,
  );

  return match?.[1]?.trim() || "";
}

function collectToolActivitiesFromResponses(responses: GeminiResponse[]) {
  const seen = new Set<string>();
  const activities: ToolActivity[] = [];

  responses.forEach((response) => {
    collectToolActivities(response).forEach((activity) => {
      const key = activityKey(activity);
      if (seen.has(key)) return;
      seen.add(key);
      activities.push(activity);
    });
  });

  return activities;
}

function activityKey(activity: ToolActivity) {
  return [
    activity.type,
    activity.title,
    activity.detail || "",
    activity.code || "",
    activity.output || "",
  ].join(":");
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

function collectSourcesFromResponses(responses: GeminiResponse[]) {
  const seen = new Set<string>();
  const sources: ReturnType<typeof collectSources> = [];

  responses.forEach((response) => {
    collectSources(response).forEach((source) => {
      if (seen.has(source.uri)) return;
      seen.add(source.uri);
      sources.push(source);
    });
  });

  return sources;
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
  data: GeminiResponse | GeminiResponse[],
  toolConfig: ReturnType<typeof buildGeminiToolConfig>,
  observability: {
    latencyMs: number;
    model: string;
    requestId: string;
  },
) {
  const responses = Array.isArray(data) ? data : [data];
  const usageSource = [...responses]
    .reverse()
    .find((response) => response.usageMetadata || response.usage_metadata);
  const usage = usageSource?.usageMetadata || usageSource?.usage_metadata;
  const usageRecord = usage as Record<string, number | undefined> | undefined;

  return {
    activities: collectToolActivitiesFromResponses(responses),
    latencyMs: observability.latencyMs,
    model: observability.model,
    requestId: observability.requestId,
    sources: collectSourcesFromResponses(responses),
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

function logChatEvent(event: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      app: "quantum",
      at: new Date().toISOString(),
      ...event,
    }),
  );
}
