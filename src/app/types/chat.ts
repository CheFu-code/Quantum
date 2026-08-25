import { GeminiResponse } from "@/app/_lib/types";

export type GeminiRole = "user" | "model";

export type ChatRequest = {
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


export type GeminiResponsePart = NonNullable<
    NonNullable<NonNullable<GeminiResponse["candidates"]>[number]["content"]>["parts"]
>[number];


export type GeneratedImage = {
    id: string;
    mimeType: string;
    data: string;
    alt: string;
};
export const MODEL_TIERS = ["flash", "pro", "ultra"] as const;

export type ModelTier = (typeof MODEL_TIERS)[number];

export type QuantumIdentity = {
    authenticated: boolean;
    email?: string;
    error?: string;
    member: boolean;
    roles: string[];
    subject: string;
    userId?: string;
};