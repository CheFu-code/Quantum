import { getAuthorizationServerMetadata } from "../../_lib/authDiscovery";

export function GET() {
  return Response.json(getAuthorizationServerMetadata(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
