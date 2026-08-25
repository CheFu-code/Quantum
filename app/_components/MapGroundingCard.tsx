"use client";

import { ExternalLink, MapPin } from "lucide-react";
import type { MessageSource } from "../_lib/types";

type MapGroundingCardProps = {
  content: string;
  sources: MessageSource[];
};

export function MapGroundingCard({ content, sources }: MapGroundingCardProps) {
  const mapsSources = sources.filter(isMapsSource);
  const primarySource = mapsSources[0];

  if (!primarySource) return null;

  const route = parseRoute(primarySource.title) || parseRoute(content);
  const title = route
    ? `Directions from ${route.origin} to ${route.destination}`
    : primarySource.title || "Google Maps result";
  const openUrl = route ? routeUrl(route) : safeGoogleMapsUrl(primarySource.uri);
  const embedUrl = route
    ? routeEmbedUrl(route)
    : placeEmbedUrl(primarySource.title || primarySource.uri);

  return (
    <div className="mt-4 grid gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin size={14} className="text-[var(--chart-4)]" />
        <span translate="no">Google Maps</span>
      </div>
      <p className="text-sm font-medium leading-snug text-foreground/90">{title}</p>
      <div className="aspect-[16/10] w-full overflow-hidden border border-border/70 bg-muted/20">
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>
      {openUrl && (
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
        >
          Open in <span translate="no">Google Maps</span>
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

export function isMapsSource(source: MessageSource) {
  return source.type === "maps" || isGoogleMapsUrl(source.uri);
}

function parseRoute(value: string) {
  const match =
    value.match(/\bdirections\s+from\s+(.+?)\s+to\s+(.+?)(?:[.;\n]|$)/i) ||
    value.match(/\bfrom\s+(.+?)\s+to\s+(.+?)(?:\s+via\b|\s+by\b|[.;\n]|$)/i);

  if (!match) return null;

  const origin = cleanPlace(match[1]);
  const destination = cleanPlace(match[2]);

  return origin && destination ? { origin, destination } : null;
}

function cleanPlace(value: string) {
  return value
    .replace(/^(?:drive|driving|travel|route)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[,:-]+$/, "");
}

function routeEmbedUrl(route: { origin: string; destination: string }) {
  const params = new URLSearchParams({
    daddr: route.destination,
    output: "embed",
    saddr: route.origin,
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

function routeUrl(route: { origin: string; destination: string }) {
  const params = new URLSearchParams({
    api: "1",
    destination: route.destination,
    origin: route.origin,
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function placeEmbedUrl(query: string) {
  const params = new URLSearchParams({
    output: "embed",
    q: query,
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

function safeGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    return isGoogleMapsUrl(url.toString()) ? url.toString() : "";
  } catch {
    return "";
  }
}

const ALLOWED_GOOGLE_MAPS_HOSTS = new Set([
  "www.google.com",
  "maps.google.com",
  "google.com",
]);

function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    // Only accept explicitly allowed Google hosts with the /maps path.
    return ALLOWED_GOOGLE_MAPS_HOSTS.has(host) && url.pathname.startsWith("/maps");
  } catch {
    return false;
  }
}
