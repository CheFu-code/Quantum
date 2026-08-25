import { accountUrl, apiBaseUrl, siteUrl } from "../site-metadata";
import {
  apiDocsUrl,
  authMdUrl,
  oauthAuthorizationServerUrl,
  openIdConfigurationUrl,
} from "./agentDiscovery";

const quantumScopes = ["openid", "profile", "email", "quantum:chat", "quantum:read"];

export function getAuthorizationServerIssuer() {
  return (
    process.env.OAUTH_ISSUER ||
    process.env.OIDC_ISSUER ||
    process.env.NEXT_PUBLIC_OAUTH_ISSUER ||
    apiBaseUrl
  ).replace(/\/$/, "");
}

export function getAuthorizationServerMetadata() {
  const issuer = getAuthorizationServerIssuer();

  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    jwks_uri: `${issuer}/oauth/jwks`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: quantumScopes,
    service_documentation: apiDocsUrl,
    protected_resources: [siteUrl],
    agent_auth: {
      skill: "auth.md",
      register_uri: authMdUrl,
      identity_types_supported: ["identity_assertion", "anonymous"],
      identity_assertion: {
        assertion_types_supported: ["verified_email"],
        credential_types_supported: ["oauth2_authorization_code_pkce"],
        claim_uri: `${issuer}/oauth/authorize`,
      },
      anonymous: {
        credential_types_supported: ["sessionless"],
        claim_uri: siteUrl,
      },
      account_management_uri: accountUrl,
    },
  };
}

export function getOpenIdConfiguration() {
  return {
    ...getAuthorizationServerMetadata(),
    claims_supported: [
      "aud",
      "email",
      "email_verified",
      "exp",
      "iat",
      "iss",
      "name",
      "profile",
      "sub",
    ],
  };
}

export function getProtectedResourceMetadata() {
  return {
    resource: siteUrl,
    authorization_servers: [getAuthorizationServerIssuer()],
    scopes_supported: quantumScopes,
    bearer_methods_supported: ["header"],
    resource_documentation: apiDocsUrl,
    openid_configuration: openIdConfigurationUrl,
    authorization_server_metadata: oauthAuthorizationServerUrl,
  };
}
