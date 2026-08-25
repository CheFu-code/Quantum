"use client";

import { ExternalLink, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildQuantumMobileLaunchHref, QUANTUM_WEB_HREF } from "../_lib/constants";

type MobilePlatform = "android" | "ios" | "other";
type LaunchState = "idle" | "opening" | "fallback";

const SESSION_ATTEMPT_KEY = "quantum-mobile-app-launch-attempted";

export function MobileAppLauncher() {
  const [visible, setVisible] = useState(false);
  const [launchState, setLaunchState] = useState<LaunchState>("idle");
  const [platform, setPlatform] = useState<MobilePlatform>("other");

  const launchInstalledApp = useCallback((targetPlatform: MobilePlatform) => {
    if (targetPlatform === "other") return;

    setLaunchState("opening");
    const fallbackUrl = window.location.href || QUANTUM_WEB_HREF;
    const launchHref = buildQuantumMobileLaunchHref({
      fallbackUrl,
      platform: targetPlatform,
    });

    const onVisibilityChange = () => {
      if (!document.hidden) return;
      window.clearTimeout(fallbackTimer);
      setVisible(false);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };

    const fallbackTimer = window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (!document.hidden) setLaunchState("fallback");
    }, 1500);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.location.href = launchHref;
  }, []);

  useEffect(() => {
    const detectedPlatform = detectMobilePlatform();
    const shouldShow = detectedPlatform !== "other" && isTouchDevice();

    if (!shouldShow) return;

    setPlatform(detectedPlatform);
    setVisible(true);

    if (window.sessionStorage.getItem(SESSION_ATTEMPT_KEY)) return;

    window.sessionStorage.setItem(SESSION_ATTEMPT_KEY, "1");
    const timeout = window.setTimeout(() => {
      launchInstalledApp(detectedPlatform);
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [launchInstalledApp]);

  const helperText = useMemo(() => {
    if (launchState === "opening") return "Opening Quantum app...";
    if (launchState === "fallback") {
      return "Still here? The app may not be installed on this device.";
    }
    return "Open the installed Quantum mobile app for the native experience.";
  }, [launchState]);

  const openButtonLabel =
    launchState === "opening" ? "Opening..." : "Open app";

  const launchFromButton = useCallback(() => {
    window.sessionStorage.setItem(SESSION_ATTEMPT_KEY, "1");
    launchInstalledApp(platform);
  }, [launchInstalledApp, platform]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-border bg-card/70 px-3 py-2 backdrop-blur sm:hidden">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-3 py-2 shadow-lg">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Smartphone size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Quantum app</p>
          <p className="text-xs leading-4 text-muted-foreground">{helperText}</p>
        </div>
        <button
          type="button"
          onClick={launchFromButton}
          disabled={launchState === "opening"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity disabled:cursor-wait disabled:opacity-70"
        >
          <ExternalLink size={12} />
          {openButtonLabel}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Dismiss app launcher"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function detectMobilePlatform(): MobilePlatform {
  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";

  if (/android/i.test(userAgent)) return "android";
  if (
    /iphone|ipad|ipod/i.test(userAgent) ||
    (platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }

  return "other";
}

function isTouchDevice() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.navigator.maxTouchPoints > 0
  );
}
