"use client";

import { useId } from "react";

export function QuantumLogo({ className = "size-7" }: { className?: string }) {
  const gradientId = useId();
  const accentId = useId();
  const glowId = useId();

  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="50%" stopColor="#c58af9" />
          <stop offset="100%" stopColor="#f28b82" />
        </linearGradient>
        <linearGradient id={accentId} x1="5" y1="20" x2="24" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#81c995" />
          <stop offset="45%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#c58af9" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.54 0 0 0 0 0.7 0 0 0 0 0.97 0 0 0 0.55 0"
          />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>
      <circle
        cx="14"
        cy="14"
        r="11.2"
        fill={`url(#${gradientId})`}
        opacity="0.96"
        filter={`url(#${glowId})`}
      />
      <circle cx="14" cy="14" r="10" fill="#0d0f14" fillOpacity="0.62" />
      <path
        d="M4.4 15.1C8.1 9.15 14.9 6.05 20.1 8.05C24.45 9.72 24.95 14.32 21.35 17.7C17.7 21.12 11.45 21.85 6.9 19.22"
        stroke={`url(#${accentId})`}
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="M5.1 11.2C8.7 17.2 15.2 20.95 20.25 19.38C24.2 18.15 24.95 14.22 21.95 11.05C18.92 7.83 13.25 6.58 8.35 8.22"
        stroke="rgba(255,255,255,0.36)"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.78"
      />
      <circle cx="14" cy="14" r="5.4" fill="#0d0f14" stroke="rgba(255,255,255,0.2)" strokeWidth="0.9" />
      <path
        d="M14 18.6C16.54 18.6 18.6 16.54 18.6 14C18.6 11.46 16.54 9.4 14 9.4C11.46 9.4 9.4 11.46 9.4 14C9.4 16.54 11.46 18.6 14 18.6Z"
        stroke="white"
        strokeWidth="1.65"
        strokeLinecap="round"
        opacity="0.94"
      />
      <path
        d="M17.4 17.45L20.35 20.4"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.92"
      />
      <circle cx="20.9" cy="8.7" r="1.3" fill="#fdd663" />
      <circle cx="7.35" cy="19.45" r="0.85" fill="#81c995" opacity="0.95" />
    </svg>
  );
}
