import { getProtectedResourceMetadata } from "../../_lib/authDiscovery";

export function GET() {
  return Response.json(getProtectedResourceMetadata(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
