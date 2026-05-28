import { siteUrl } from "../site-metadata";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
