import { accountUrl, apiBaseUrl, siteName, siteUrl } from "../site-metadata";
import {
  apiDocsUrl,
  oauthProtectedResourceUrl,
  openIdConfigurationUrl,
} from "../_lib/agentDiscovery";

export function GET() {
  const markdown = `# auth.md

${siteName} uses CheFu Account OAuth/OIDC for agent and user authentication.

## Resource

- Resource: ${siteUrl}
- Protected resource metadata: ${oauthProtectedResourceUrl}
- OpenID configuration: ${openIdConfigurationUrl}
- API documentation: ${apiDocsUrl}

## Authorization Server

- Issuer: ${apiBaseUrl}
- Authorization endpoint: ${apiBaseUrl}/oauth/authorize
- Token endpoint: ${apiBaseUrl}/oauth/token
- JWKS URI: ${apiBaseUrl}/oauth/jwks
- Account management: ${accountUrl}

## OAuth Client

Use the public browser client \`quantum-web\` with Authorization Code + PKCE.

## Scopes

- \`openid\`
- \`profile\`
- \`email\`
- \`quantum:chat\`
- \`quantum:read\`

## Agent Registration

Agents should use the OAuth metadata above, request the minimum required scopes, and identify themselves clearly in the OAuth client/user-agent flow. Automated self-registration is not enabled from this document; agents that need persistent credentials should use the account management URL.
`;

  return new Response(markdown, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
