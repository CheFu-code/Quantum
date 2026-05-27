import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_QUANTUM_APP_URL || "https://quantum.chefuinc.com";

  return [
    {
      url: siteUrl.replace(/\/$/, ""),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
