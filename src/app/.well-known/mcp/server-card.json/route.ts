import { siteDescription, siteName, siteUrl } from "../../../site-metadata";
import {
  apiDocsUrl,
  mcpEndpointUrl,
  openApiUrl,
} from "../../../_lib/agentDiscovery";

export function GET() {
  return Response.json(
    {
      schemaVersion: "0.1.0",
      serverInfo: {
        name: `${siteName} Agent Tools`,
        version: "1.0.0",
        description: siteDescription,
      },
      transport: {
        type: "streamable-http",
        endpoint: mcpEndpointUrl,
      },
      transports: [
        {
          type: "streamable-http",
          endpoint: mcpEndpointUrl,
          url: mcpEndpointUrl,
        },
      ],
      capabilities: {
        tools: {
          listChanged: false,
        },
        resources: {
          listChanged: false,
        },
        prompts: {
          listChanged: false,
        },
      },
      documentationUrl: apiDocsUrl,
      serviceDescriptionUrl: openApiUrl,
      websiteUrl: siteUrl,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
