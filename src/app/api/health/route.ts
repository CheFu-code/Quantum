import { siteName, siteUrl } from "../../site-metadata";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: siteName,
      url: siteUrl,
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
