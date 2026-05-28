import type { MetadataRoute } from "next";
import {
  agentSkillsIndexPath,
  apiCatalogPath,
  apiDocsPath,
  authMdPath,
  healthPath,
  mcpServerCardPath,
  oauthAuthorizationServerPath,
  oauthProtectedResourcePath,
  openApiPath,
  openIdConfigurationPath,
} from "./_lib/agentDiscovery";
import { siteUrl } from "./site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    apiDocsPath,
    apiCatalogPath,
    openApiPath,
    healthPath,
    openIdConfigurationPath,
    oauthAuthorizationServerPath,
    oauthProtectedResourcePath,
    mcpServerCardPath,
    agentSkillsIndexPath,
    authMdPath,
  ];

  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
