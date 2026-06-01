import { createHash } from "node:crypto";
import { siteDescription, siteName, siteUrl } from "../site-metadata";

export type AgentSkill = {
  slug: string;
  name: string;
  type: "skill-md";
  description: string;
  content: string;
};

export const agentSkills: AgentSkill[] = [
  {
    slug: "quantum-overview",
    name: "quantum-overview",
    type: "skill-md",
    description:
      "Understand Quantum as a CheFu AI chat workspace and identify its user-facing capabilities.",
    content: `# Quantum Overview

Use this skill when an agent needs to understand Quantum.

## Product

${siteName} is a CheFu AI chat workspace.

${siteDescription}

## Capabilities

- General-purpose AI chat for research, coding, writing, and analysis.
- Model mode selection across Quantum Flash, Quantum Pro, and Quantum Ultra.
- Optional search grounding, URL context, code execution, Maps grounding, and configured knowledge stores.
- Image, PDF, and text-based attachment support for signed-in users.
- Conversation history management, export, and preference controls.

## Useful URLs

- ${siteUrl}/
- ${siteUrl}/docs/api
- ${siteUrl}/auth.md
`,
  },
  {
    slug: "quantum-chat-workflow",
    name: "quantum-chat-workflow",
    type: "skill-md",
    description:
      "Guide agents that help users prepare effective Quantum chat prompts and workspace actions.",
    content: `# Quantum Chat Workflow

Use this skill when helping a user prepare work for Quantum.

## Prompt Preparation

- Capture the user's goal.
- Identify the desired response style: concise, balanced, or detailed.
- Include relevant context, constraints, files, or image references.
- Ask for an output format when the user needs a table, checklist, code, or prose.

## Workspace Actions

- Start a new conversation at ${siteUrl}/.
- Use search grounding only when current information may affect the answer.
- Use URL context when the prompt names public pages to inspect.
- Use code execution for calculations, data checks, and reproducible analysis.
- Export conversations when the user needs a local record.
- Clear history when the user wants to remove saved workspace state.
`,
  },
  {
    slug: "quantum-agent-discovery",
    name: "quantum-agent-discovery",
    type: "skill-md",
    description:
      "Discover Quantum machine-readable metadata, API catalog, OAuth metadata, MCP server card, and health endpoints.",
    content: `# Quantum Agent Discovery

Use this skill when an agent needs machine-readable discovery resources for Quantum.

## Resources

- API catalog: ${siteUrl}/.well-known/api-catalog
- OpenAPI description: ${siteUrl}/.well-known/openapi.json
- API documentation: ${siteUrl}/docs/api
- OAuth authorization server metadata: ${siteUrl}/.well-known/oauth-authorization-server
- OpenID configuration: ${siteUrl}/.well-known/openid-configuration
- OAuth protected resource metadata: ${siteUrl}/.well-known/oauth-protected-resource
- MCP server card: ${siteUrl}/.well-known/mcp/server-card.json
- Agent skills index: ${siteUrl}/.well-known/agent-skills/index.json
- Auth.md: ${siteUrl}/auth.md
- Health endpoint: ${siteUrl}/api/health
`,
  },
];

export function getAgentSkillUrl(slug: string) {
  return `${siteUrl}/.well-known/agent-skills/${slug}/SKILL.md`;
}

export function getAgentSkillDigest(content: string) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function getAgentSkill(slug: string) {
  return agentSkills.find((skill) => skill.slug === slug) ?? null;
}
