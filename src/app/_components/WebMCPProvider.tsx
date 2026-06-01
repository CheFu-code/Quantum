"use client";

import { useEffect } from "react";

type JsonObject = Record<string, unknown>;

type WebMCPTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonObject;
  execute: (input: JsonObject) => Promise<unknown> | unknown;
  readOnlyHint?: boolean;
};

declare global {
  interface Document {
    modelContext?: {
      registerTool?: (
        tool: WebMCPTool,
        options?: { signal?: AbortSignal },
      ) => unknown;
    };
  }

  interface Navigator {
    modelContext?: {
      provideContext?: (context: { tools: WebMCPTool[] }) => Promise<unknown> | unknown;
    };
  }
}

const discoveryResources = {
  apiCatalog: "/.well-known/api-catalog",
  openApi: "/.well-known/openapi.json",
  apiDocs: "/docs/api",
  health: "/api/health",
  openIdConfiguration: "/.well-known/openid-configuration",
  oauthProtectedResource: "/.well-known/oauth-protected-resource",
  mcpServerCard: "/.well-known/mcp/server-card.json",
  agentSkills: "/.well-known/agent-skills/index.json",
  authMd: "/auth.md",
};

function buildPrompt(goal: unknown, responseStyle: unknown) {
  const normalizedGoal = String(goal || "").trim();
  const normalizedStyle = ["concise", "balanced", "detailed"].includes(
    String(responseStyle),
  )
    ? String(responseStyle)
    : "balanced";

  return [
    `Goal: ${normalizedGoal || "Describe the user's desired outcome."}`,
    `Response style: ${normalizedStyle}`,
    "Context: Add relevant constraints, files, examples, links, or image details.",
    "Output: Name the exact format needed, such as prose, code, checklist, or table.",
  ].join("\n");
}

export function WebMCPProvider() {
  useEffect(() => {
    const tools: WebMCPTool[] = [
      {
        name: "quantum_get_app_profile",
        title: "Get Quantum Profile",
        description:
          "Get a concise profile of Quantum, including capabilities and key routes.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        readOnlyHint: true,
        execute: () => ({
          name: "Quantum",
          summary:
            "Quantum is a CheFu AI chat workspace for focused research, coding, writing, analysis, and image-assisted work.",
          capabilities: [
            "AI chat",
            "model mode selection",
            "optional search grounding",
            "URL context",
            "code execution",
            "Maps grounding",
            "file-backed knowledge search",
            "image, PDF, and text file input for signed-in users",
            "conversation history controls",
          ],
          routes: {
            chat: "/",
            apiDocs: discoveryResources.apiDocs,
            auth: discoveryResources.authMd,
          },
        }),
      },
      {
        name: "quantum_prepare_prompt",
        title: "Prepare Quantum Prompt",
        description:
          "Turn a user goal into a structured prompt that can be pasted into Quantum.",
        inputSchema: {
          type: "object",
          properties: {
            goal: {
              type: "string",
              description: "The outcome the user wants from Quantum.",
            },
            responseStyle: {
              type: "string",
              enum: ["concise", "balanced", "detailed"],
            },
          },
          required: ["goal"],
          additionalProperties: false,
        },
        readOnlyHint: true,
        execute: ({ goal, responseStyle }) => ({
          prompt: buildPrompt(goal, responseStyle),
        }),
      },
      {
        name: "quantum_open_chat",
        title: "Open Quantum Chat",
        description: "Navigate the browser to the Quantum chat workspace.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: () => {
          window.location.assign("/");
          return { navigatedTo: "/" };
        },
      },
      {
        name: "quantum_get_discovery_resources",
        title: "Get Discovery Resources",
        description:
          "Return Quantum discovery endpoints for APIs, auth, skills, and MCP.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        readOnlyHint: true,
        execute: () => discoveryResources,
      },
    ];

    const controller = new AbortController();
    const modelContext = document.modelContext;

    if (modelContext?.registerTool) {
      tools.forEach((tool) => {
        try {
          modelContext.registerTool?.(tool, { signal: controller.signal });
        } catch (error) {
          console.warn(`Could not register WebMCP tool ${tool.name}:`, error);
        }
      });
    }

    if (navigator.modelContext?.provideContext) {
      void navigator.modelContext.provideContext({ tools });
    }

    return () => controller.abort();
  }, []);

  return null;
}
