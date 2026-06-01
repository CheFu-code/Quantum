import { siteDescription, siteName, siteUrl } from "../../site-metadata";
import {
  agentSkillsIndexUrl,
  apiCatalogUrl,
  apiDocsUrl,
  authMdUrl,
  mcpServerCardUrl,
  openApiUrl,
} from "../../_lib/agentDiscovery";

const tools = [
  {
    name: "quantum_get_app_profile",
    description: "Return a concise profile of the Quantum AI workspace.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "quantum_prepare_prompt",
    description:
      "Prepare a structured prompt for a Quantum chat session from a user goal.",
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
  },
  {
    name: "quantum_get_discovery_resources",
    description:
      "Return Quantum discovery resources for APIs, auth, skills, and MCP.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

function jsonRpc(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result });
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } });
}

export function GET() {
  return Response.json({
    name: `${siteName} Agent Tools`,
    version: "1.0.0",
    protocol: "mcp",
    transport: "streamable-http",
    tools,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id ?? null;
  const method = body?.method;

  if (method === "initialize") {
    return jsonRpc(id, {
      protocolVersion: "2025-03-26",
      serverInfo: {
        name: `${siteName} Agent Tools`,
        version: "1.0.0",
      },
      capabilities: {
        tools: {},
      },
    });
  }

  if (method === "tools/list") {
    return jsonRpc(id, { tools });
  }

  if (method === "tools/call") {
    const toolName = body?.params?.name;
    const args = body?.params?.arguments ?? {};

    if (toolName === "quantum_get_app_profile") {
      return jsonRpc(id, {
        content: [
          {
            type: "text",
            text: [
              `${siteName}: ${siteDescription}`,
              "Capabilities: chat, search grounding, URL context, code execution, Maps grounding, configured knowledge search, file attachments, and conversation controls.",
            ].join("\n"),
          },
        ],
      });
    }

    if (toolName === "quantum_prepare_prompt") {
      const goal = String(args.goal || "").trim();
      const responseStyle = String(args.responseStyle || "balanced");

      return jsonRpc(id, {
        content: [
          {
            type: "text",
            text: [
              `Goal: ${goal || "Describe the user's desired outcome."}`,
              `Response style: ${responseStyle}`,
              "Context: Include relevant constraints, files, links, and examples.",
              "Output: Ask Quantum for the specific format the user needs.",
            ].join("\n"),
          },
        ],
      });
    }

    if (toolName === "quantum_get_discovery_resources") {
      return jsonRpc(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                website: siteUrl,
                apiCatalog: apiCatalogUrl,
                openApi: openApiUrl,
                apiDocs: apiDocsUrl,
                mcpServerCard: mcpServerCardUrl,
                agentSkills: agentSkillsIndexUrl,
                authMd: authMdUrl,
              },
              null,
              2,
            ),
          },
        ],
      });
    }

    return jsonRpcError(id, -32601, "Tool not found");
  }

  return jsonRpcError(id, -32601, "Method not found");
}
