import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_QUANTUM_APP_URL || "https://quantum.chefuinc.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
