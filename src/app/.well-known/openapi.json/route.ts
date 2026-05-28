import { siteName, siteUrl } from "../../site-metadata";
import {
  agentSkillsIndexPath,
  apiCatalogPath,
  authMdPath,
  healthPath,
  mcpEndpointPath,
  mcpServerCardPath,
  oauthAuthorizationServerPath,
  oauthProtectedResourcePath,
  openIdConfigurationPath,
} from "../../_lib/agentDiscovery";

export function GET() {
  const body = {
    openapi: "3.1.0",
    info: {
      title: `${siteName} Discovery API`,
      version: "1.0.0",
      description:
        "Machine-readable discovery endpoints for Quantum agents and automated clients.",
    },
    servers: [{ url: siteUrl }],
    paths: {
      "/api/chat": {
        post: {
          operationId: "createQuantumChatResponse",
          summary: "Create a Quantum chat response",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    model: { type: "string", enum: ["flash", "pro", "ultra"] },
                    responseStyle: {
                      type: "string",
                      enum: ["concise", "balanced", "detailed"],
                    },
                    webSearch: { type: "boolean" },
                    history: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          role: { type: "string", enum: ["user", "assistant"] },
                          content: { type: "string" },
                        },
                      },
                    },
                  },
                  required: ["message"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Quantum response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      createdAt: { type: "string", format: "date-time" },
                      message: { type: "string" },
                      model: { type: "string" },
                      tier: { type: "string" },
                    },
                    required: ["createdAt", "message", "model", "tier"],
                  },
                },
              },
            },
          },
        },
      },
      [healthPath]: {
        get: {
          operationId: "getQuantumHealth",
          summary: "Read Quantum health status",
          responses: {
            "200": {
              description: "Health status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      service: { type: "string" },
                      url: { type: "string", format: "uri" },
                      checkedAt: { type: "string", format: "date-time" },
                    },
                    required: ["status", "service", "url", "checkedAt"],
                  },
                },
              },
            },
          },
        },
      },
      [apiCatalogPath]: {
        get: {
          operationId: "getQuantumApiCatalog",
          summary: "Read the RFC 9727 API catalog",
          responses: {
            "200": {
              description: "API catalog linkset",
              content: {
                "application/linkset+json": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
      },
      [openIdConfigurationPath]: {
        get: {
          operationId: "getQuantumOpenIdConfiguration",
          summary: "Read OpenID Connect discovery metadata",
          responses: { "200": { description: "OIDC metadata" } },
        },
      },
      [oauthAuthorizationServerPath]: {
        get: {
          operationId: "getQuantumOAuthAuthorizationServer",
          summary: "Read OAuth authorization server metadata",
          responses: { "200": { description: "OAuth metadata" } },
        },
      },
      [oauthProtectedResourcePath]: {
        get: {
          operationId: "getQuantumOAuthProtectedResource",
          summary: "Read OAuth protected resource metadata",
          responses: {
            "200": { description: "Protected resource metadata" },
          },
        },
      },
      [mcpServerCardPath]: {
        get: {
          operationId: "getQuantumMcpServerCard",
          summary: "Read MCP server card",
          responses: { "200": { description: "MCP server card" } },
        },
      },
      [mcpEndpointPath]: {
        post: {
          operationId: "callQuantumMcp",
          summary: "Call Quantum MCP tools using JSON-RPC",
          responses: { "200": { description: "JSON-RPC response" } },
        },
      },
      [agentSkillsIndexPath]: {
        get: {
          operationId: "getQuantumAgentSkills",
          summary: "Read agent skills discovery index",
          responses: { "200": { description: "Agent skills index" } },
        },
      },
      [authMdPath]: {
        get: {
          operationId: "getQuantumAuthMd",
          summary: "Read Auth.md registration instructions",
          responses: { "200": { description: "Auth.md" } },
        },
      },
    },
    components: {
      securitySchemes: {
        OAuth2: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: "https://api.chefuinc.com/oauth/authorize",
              tokenUrl: "https://api.chefuinc.com/oauth/token",
              scopes: {
                openid: "OpenID Connect identity",
                profile: "User profile",
                email: "User email address",
                "quantum:chat": "Use Quantum chat features",
                "quantum:read": "Read Quantum account resources",
              },
            },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/vnd.oai.openapi+json; charset=utf-8",
    },
  });
}
