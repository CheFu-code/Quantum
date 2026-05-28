import { siteName, siteUrl } from "../../site-metadata";
import {
  apiDocsUrl,
  healthUrl,
  mcpServerCardUrl,
  oauthProtectedResourceUrl,
  openApiUrl,
  openIdConfigurationUrl,
} from "../../_lib/agentDiscovery";

export function GET() {
  const body = {
    linkset: [
      {
        anchor: siteUrl,
        "service-desc": [
          {
            href: openApiUrl,
            type: "application/vnd.oai.openapi+json",
            title: `${siteName} OpenAPI description`,
          },
          {
            href: openIdConfigurationUrl,
            type: "application/json",
            title: "OpenID Connect discovery metadata",
          },
          {
            href: oauthProtectedResourceUrl,
            type: "application/json",
            title: "OAuth protected resource metadata",
          },
          {
            href: mcpServerCardUrl,
            type: "application/json",
            title: "MCP server card",
          },
        ],
        "service-doc": [
          {
            href: apiDocsUrl,
            type: "text/html",
            title: `${siteName} API documentation`,
          },
        ],
        status: [
          {
            href: healthUrl,
            type: "application/json",
            title: `${siteName} health status`,
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/linkset+json; charset=utf-8",
    },
  });
}
