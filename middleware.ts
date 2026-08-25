import { NextResponse, type NextRequest } from "next/server";
import {
  agentLinkHeader,
  agentMarkdownByPath,
  estimateMarkdownTokens,
} from "./app/_lib/agentDiscovery";

function acceptsMarkdown(request: NextRequest) {
  return request.headers
    .get("accept")
    ?.toLowerCase()
    .split(",")
    .some((value) => value.trim().startsWith("text/markdown"));
}

function addAgentHeaders(response: NextResponse) {
  response.headers.set("Link", agentLinkHeader);
  response.headers.append("Vary", "Accept");
  return response;
}

function withRequestId(request: NextRequest, response: NextResponse) {
  response.headers.set(
    "x-request-id",
    request.headers.get("x-request-id") || crypto.randomUUID(),
  );
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  if (request.method === "GET" && acceptsMarkdown(request)) {
    const markdown = agentMarkdownByPath[normalizedPath];

    if (markdown) {
      return withRequestId(
        request,
        new NextResponse(markdown, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Link": agentLinkHeader,
            "Vary": "Accept",
            "x-markdown-tokens": estimateMarkdownTokens(markdown),
          },
        }),
      );
    }
  }

  if (normalizedPath === "/") {
    return withRequestId(request, addAgentHeaders(NextResponse.next()));
  }

  return withRequestId(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2)).*)",
  ],
};
