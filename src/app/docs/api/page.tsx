import { siteName } from "../../site-metadata";
import {
  agentSkillsIndexPath,
  apiCatalogPath,
  authMdPath,
  healthPath,
  mcpEndpointPath,
  mcpServerCardPath,
  oauthAuthorizationServerPath,
  oauthProtectedResourcePath,
  openApiPath,
  openIdConfigurationPath,
} from "../../_lib/agentDiscovery";

export const metadata = {
  title: `API Documentation | ${siteName}`,
  description:
    "Machine-readable discovery resources for Quantum agents and automated clients.",
};

const endpoints = [
  {
    path: apiCatalogPath,
    label: "API catalog",
    type: "application/linkset+json",
  },
  {
    path: openApiPath,
    label: "OpenAPI description",
    type: "application/vnd.oai.openapi+json",
  },
  { path: healthPath, label: "Health status", type: "application/json" },
  { path: "/api/chat", label: "Chat response endpoint", type: "application/json" },
  {
    path: openIdConfigurationPath,
    label: "OpenID Connect discovery",
    type: "application/json",
  },
  {
    path: oauthAuthorizationServerPath,
    label: "OAuth authorization server metadata",
    type: "application/json",
  },
  {
    path: oauthProtectedResourcePath,
    label: "OAuth protected resource metadata",
    type: "application/json",
  },
  {
    path: mcpServerCardPath,
    label: "MCP server card",
    type: "application/json",
  },
  {
    path: mcpEndpointPath,
    label: "MCP streamable HTTP endpoint",
    type: "application/json",
  },
  {
    path: agentSkillsIndexPath,
    label: "Agent skills index",
    type: "application/json",
  },
  { path: authMdPath, label: "Auth.md", type: "text/markdown" },
];

export default function Page() {
  return (
    <main className="min-h-dvh bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <img alt="" className="h-10 w-10" src="/quantum-logo.svg" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Agent Discovery
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Quantum API Documentation
            </h1>
          </div>
        </div>

        <p className="mb-8 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          These endpoints help agents and automated clients discover Quantum
          metadata, authentication configuration, service descriptions, and
          browser-exposed tools.
        </p>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-card text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Endpoint</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={endpoint.path} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-primary">
                    {endpoint.path}
                  </td>
                  <td className="px-4 py-3 text-foreground">{endpoint.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {endpoint.type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
