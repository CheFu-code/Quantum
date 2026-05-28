import { siteDescription, siteName, siteUrl } from "../site-metadata";

export const apiCatalogPath = "/.well-known/api-catalog";
export const openApiPath = "/.well-known/openapi.json";
export const apiDocsPath = "/docs/api";
export const healthPath = "/api/health";
export const openIdConfigurationPath = "/.well-known/openid-configuration";
export const oauthAuthorizationServerPath =
  "/.well-known/oauth-authorization-server";
export const oauthProtectedResourcePath =
  "/.well-known/oauth-protected-resource";
export const mcpServerCardPath = "/.well-known/mcp/server-card.json";
export const agentSkillsIndexPath = "/.well-known/agent-skills/index.json";
export const mcpEndpointPath = "/api/mcp";
export const authMdPath = "/auth.md";

export const apiCatalogUrl = new URL(apiCatalogPath, siteUrl).toString();
export const openApiUrl = new URL(openApiPath, siteUrl).toString();
export const apiDocsUrl = new URL(apiDocsPath, siteUrl).toString();
export const healthUrl = new URL(healthPath, siteUrl).toString();
export const openIdConfigurationUrl = new URL(
  openIdConfigurationPath,
  siteUrl,
).toString();
export const oauthAuthorizationServerUrl = new URL(
  oauthAuthorizationServerPath,
  siteUrl,
).toString();
export const oauthProtectedResourceUrl = new URL(
  oauthProtectedResourcePath,
  siteUrl,
).toString();
export const mcpServerCardUrl = new URL(mcpServerCardPath, siteUrl).toString();
export const agentSkillsIndexUrl = new URL(
  agentSkillsIndexPath,
  siteUrl,
).toString();
export const mcpEndpointUrl = new URL(mcpEndpointPath, siteUrl).toString();
export const authMdUrl = new URL(authMdPath, siteUrl).toString();

export const agentLinkHeader = [
  `<${apiCatalogPath}>; rel="api-catalog"; type="application/linkset+json"`,
  `<${openApiPath}>; rel="service-desc"; type="application/vnd.oai.openapi+json"`,
  `<${apiDocsPath}>; rel="service-doc"; type="text/html"`,
  `<${healthPath}>; rel="status"; type="application/json"`,
  `<${openIdConfigurationPath}>; rel="service-desc"; type="application/json"`,
  `<${oauthProtectedResourcePath}>; rel="service-desc"; type="application/json"`,
  `<${mcpServerCardPath}>; rel="describedby"; type="application/json"; title="MCP Server Card"`,
  `<${agentSkillsIndexPath}>; rel="describedby"; type="application/json"; title="Agent Skills Index"`,
  `<${authMdPath}>; rel="describedby"; type="text/markdown"; title="Auth.md"`,
].join(", ");

export const homeMarkdown = `# ${siteName}

${siteDescription}

## Core Capabilities

- Chat with Quantum Flash, Quantum Pro, and Quantum Ultra modes.
- Ask for research, coding support, writing, analysis, and planning help.
- Attach images for visual understanding when signed in.
- Use optional web search and configurable response style preferences.
- Save, rename, export, and clear conversation history through the workspace.

## User Routes

- [Chat Workspace](/)
- [API Documentation](${apiDocsPath})
- [Auth.md](${authMdPath})

## Agent Discovery

- [API Catalog](${apiCatalogPath})
- [OpenAPI Description](${openApiPath})
- [Health Status](${healthPath})
- [OpenID Configuration](${openIdConfigurationPath})
- [OAuth Authorization Server Metadata](${oauthAuthorizationServerPath})
- [OAuth Protected Resource Metadata](${oauthProtectedResourcePath})
- [MCP Server Card](${mcpServerCardPath})
- [Agent Skills Index](${agentSkillsIndexPath})
`;

export const apiDocsMarkdown = `# ${siteName} API Documentation

Quantum exposes public discovery metadata for agents and automated clients.

## Endpoints

- GET ${apiCatalogPath}: API catalog as application/linkset+json.
- GET ${openApiPath}: OpenAPI service description.
- GET ${healthPath}: JSON health status.
- POST /api/chat: Quantum chat completion endpoint used by the browser app.
- GET ${openIdConfigurationPath}: OpenID Connect discovery metadata.
- GET ${oauthAuthorizationServerPath}: OAuth 2.0 authorization server metadata.
- GET ${oauthProtectedResourcePath}: OAuth protected resource metadata.
- GET ${mcpServerCardPath}: MCP server card for agent discovery.
- GET ${agentSkillsIndexPath}: Agent skills discovery index.
- GET ${authMdPath}: Agent registration and authentication instructions.
`;

export const agentMarkdownByPath: Record<string, string> = {
  "/": homeMarkdown,
  [apiDocsPath]: apiDocsMarkdown,
};

export function estimateMarkdownTokens(markdown: string) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words * 1.35)).toString();
}
