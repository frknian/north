"use client";

import React from "react";
import type { CompanionColor, CompanionOutfit } from "@/lib/types";

export interface CompanionColorDef {
  id: CompanionColor;
  label: string;
  bg: string;
  glow: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  shadow: string;
  border: string;
}

export const COMPANION_COLORS: CompanionColorDef[] = [
  {
    id: "blue",
    label: "Safir Mavi",
    bg: "bg-blue-500",
    glow: "rgba(59, 130, 246, 0.7)",
    gradientStart: "#bfdbfe",
    gradientMid: "#3b82f6",
    gradientEnd: "#2563eb",
    shadow: "#1d4ed8",
    border: "border-blue-500",
  },
  {
    id: "purple",
    label: "Ametist Mor",
    bg: "bg-purple-500",
    glow: "rgba(168, 85, 247, 0.7)",
    gradientStart: "#f3e8ff",
    gradientMid: "#a855f7",
    gradientEnd: "#9333ea",
    shadow: "#7e22ce",
    border: "border-purple-500",
  },
  {
    id: "emerald",
    label: "Zümrüt Yeşil",
    bg: "bg-emerald-500",
    glow: "rgba(16, 185, 129, 0.7)",
    gradientStart: "#d1fae5",
    gradientMid: "#10b981",
    gradientEnd: "#059669",
    shadow: "#047857",
    border: "border-emerald-500",
  },
  {
    id: "amber",
    label: "Güneş Altını",
    bg: "bg-amber-500",
    glow: "rgba(245, 158, 11, 0.7)",
    gradientStart: "#fef3c7",
    gradientMid: "#f59e0b",
    gradientEnd: "#d97706",
    shadow: "#b45309",
    border: "border-amber-500",
  },
  {
    id: "rose",
    label: "Yakut Gül",
    bg: "bg-rose-500",
    glow: "rgba(244, 63, 94, 0.7)",
    gradientStart: "#ffe4e6",
    gradientMid: "#f43f5e",
    gradientEnd: "#e11d48",
    shadow: "#be123c",
    border: "border-rose-500",
  },
  {
    id: "cyan",
    label: "Siber Turkuaz",
    bg: "bg-cyan-500",
    glow: "rgba(6, 182, 212, 0.7)",
    gradientStart: "#cffafe",
    gradientMid: "#06b6d4",
    gradientEnd: "#0891b2",
    shadow: "#0e7490",
    border: "border-cyan-500",
  },
  {
    id: "indigo",
    label: "Kozmik İndigo",
    bg: "bg-indigo-500",
    glow: "rgba(99, 102, 241, 0.7)",
    gradientStart: "#e0e7ff",
    gradientMid: "#6366f1",
    gradientEnd: "#4f46e5",
    shadow: "#4338ca",
    border: "border-indigo-500",
  },
  {
    id: "obsidian",
    label: "Obsidyen Titanyum",
    bg: "bg-slate-600",
    glow: "rgba(148, 163, 184, 0.7)",
    gradientStart: "#e2e8f0",
    gradientMid: "#64748b",
    gradientEnd: "#475569",
    shadow: "#334155",
    border: "border-slate-500",
  },
];

export interface CompanionOutfitDef {
  id: CompanionOutfit;
  label: string;
  icon: string;
  description: string;
}

export const COMPANION_OUTFITS: CompanionOutfitDef[] = [
  { id: "none", label: "Sade", icon: "🫧", description: "Doğal ve minimalist saf küre" },
  { id: "scarf", label: "Kışlık Atkı", icon: "🧣", description: "Sıcak ve konforlu kırmızı örgü atkı" },
  { id: "glasses", label: "Akıllı Gözlük", icon: "👓", description: "Derin odaklanma ve bilgelik gözlüğü" },
  { id: "headphones", label: "Stüdyo Kulaklık", icon: "🎧", description: "Dış sesleri kesen müzik kulaklığı" },
  { id: "hat", label: "Mezuniyet Şapkası", icon: "🎓", description: "Akademik başarı ve hedef kepi" },
  { id: "crown", label: "Zafer Tacı", icon: "👑", description: "Hedef şampiyonlarının altın tacı" },
  { id: "cape", label: "Kahraman Pelerini", icon: "🦸", description: "Durdurulamaz süper kahraman pelerini" },
  { id: "bandana", label: "Odak Bandı", icon: "🥋", description: "Disiplinli ninja ve sporcu bandı" },
];

export interface GrowthStageDef {
  level: number;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  scale: number;
}

export const GROWTH_STAGES: GrowthStageDef[] = [
  {
    level: 1,
    title: "Pusula",
    subtitle: "Tohum Seviyesi",
    badge: "🧭",
    description: "Yeni bir yolculuğun ilk adımları. Odak alışkanlığını oluşturuyor.",
    scale: 0.88,
  },
  {
    level: 2,
    title: "Yol Arkadaşı",
    subtitle: "Gelişen Filiz",
    badge: "🌱",
    description: "Seninle birlikte ritim yakaladı, günlük görevlerini hevesle bekliyor.",
    scale: 0.96,
  },
  {
    level: 3,
    title: "Keşifçi",
    subtitle: "Rehber Gezgin",
    badge: "⚡",
    description: "Zorlu konulara meydan okuyor, çalışma alanında kıvılcımlar saçıyor.",
    scale: 1.05,
  },
  {
    level: 4,
    title: "Muhafız",
    subtitle: "Usta Muhafız",
    badge: "🔮",
    description: "Derin odaklanma aurasına büründü. Dikkat dağıtıcıları bertaraf eder.",
    scale: 1.14,
  },
  {
    level: 5,
    title: "Kutup Yıldızı",
    subtitle: "Astral Zirve",
    badge: "✨",
    description: "Efsanevi astral form! Kozmik yörünge halkası ve altın taç parıltısı.",
    scale: 1.24,
  },
];

interface CompanionAvatarProps {
  color?: CompanionColor;
  outfit?: CompanionOutfit;
  level?: number;
  size?: number; // size in px, defaults to 35
  animate?: boolean;
  className?: string;
  showAura?: boolean;
}

export function CompanionAvatar({
  color = "blue",
  outfit = "none",
  level = 1,
  size = 35,
  animate = true,
  className = "",
  showAura = true,
}: CompanionAvatarProps) {
  const currentColor = COMPANION_COLORS.find((c) => c.id === color) || COMPANION_COLORS[0];
  const currentStage = GROWTH_STAGES.find((s) => s.level === level) || GROWTH_STAGES[0];
  const uniqueId = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradId = `comp-grad-${color}-${uniqueId}`;
  const specId = `comp-spec-${color}-${uniqueId}`;

  // Calculated scaling based on growth stage
  const stageScale = currentStage.scale;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        filter: showAura
          ? `drop-shadow(0 0 ${Math.max(4, Math.round(size * 0.2))}px ${currentColor.glow})`
          : undefined,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full overflow-visible ${animate ? "transition-transform duration-500" : ""}`}
        style={{
          transform: `scale(${stageScale})`,
          transformOrigin: "center center",
        }}
      >
        <defs>
          {/* Main 3D Sphere Body Gradient - Fully dynamic based on selected color */}
          <radialGradient id={gradId} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor={currentColor.gradientStart} />
            <stop offset="42%" stopColor={currentColor.gradientMid} />
            <stop offset="82%" stopColor={currentColor.gradientEnd} />
            <stop offset="100%" stopColor={currentColor.shadow} />
          </radialGradient>

          {/* 3D Specular Highlight */}
          <radialGradient id={specId} cx="35%" cy="25%" r="40%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Gold Crown Gradient */}
          <linearGradient id="comp-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          {/* Astral Ring Gradient for Level 5 */}
          <linearGradient id="comp-astral-ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={currentColor.gradientStart} stopOpacity="0.1" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor={currentColor.gradientMid} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* --- LEVEL-BASED AURAS & ORBIT RINGS (BACKGROUND) --- */}
        {level >= 4 && (
          <g className={animate ? "animate-pulse" : ""}>
            <circle
              cx="50"
              cy="52"
              r="44"
              fill="none"
              stroke={currentColor.gradientStart}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.6"
            />
          </g>
        )}

        {level >= 5 && (
          <g>
            {/* Tilted cosmic orbit ring behind orb */}
            <ellipse
              cx="50"
              cy="56"
              rx="48"
              ry="16"
              fill="none"
              stroke="url(#comp-astral-ring)"
              strokeWidth="2.5"
              transform="rotate(-15 50 56)"
              strokeDasharray="160"
              strokeDashoffset="80"
              opacity="0.85"
            />
            {/* Astral Sparkle Star Top Right */}
            <path
              d="M 86 16 Q 86 24 94 24 Q 86 24 86 32 Q 86 24 78 24 Q 86 24 86 16 Z"
              fill="#fef08a"
              opacity="0.9"
            />
            {/* Astral Sparkle Star Top Left */}
            <path
              d="M 14 26 Q 14 31 19 31 Q 14 31 14 36 Q 14 31 9 31 Q 14 31 14 26 Z"
              fill="#ffffff"
              opacity="0.8"
            />
          </g>
        )}

        {level === 3 && (
          <g>
            {/* Sparkle stars for Level 3 */}
            <path
              d="M 82 22 Q 82 27 87 27 Q 82 27 82 32 Q 82 27 77 27 Q 82 27 82 22 Z"
              fill={currentColor.gradientStart}
              opacity="0.8"
            />
          </g>
        )}

        {/* --- CAPE OUTFIT (BEHIND BODY) --- */}
        {outfit === "cape" && (
          <g>
            {/* Left cape flare */}
            <path
              d="M 28 54 Q 10 74 14 94 Q 28 91 35 78 Z"
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="1"
            />
            {/* Right cape flare */}
            <path
              d="M 72 54 Q 90 74 86 94 Q 72 91 65 78 Z"
              fill="#b91c1c"
              stroke="#7f1d1d"
              strokeWidth="1"
            />
            {/* Cape bottom rim */}
            <path
              d="M 14 94 Q 50 102 86 94 Q 50 96 14 94 Z"
              fill="#991b1b"
            />
          </g>
        )}

        {/* --- MAIN BODY ORB --- */}
        {/* Soft base shadow for 3D grounding */}
        <ellipse cx="50" cy="88" rx="24" ry="6" fill="#000000" opacity="0.18" />

        {/* The Colored Body Sphere with solid vibrant fallback */}
        <ellipse
          cx="50"
          cy="52"
          rx="35"
          ry="34"
          fill={currentColor.gradientMid}
          style={{ fill: `url(#${gradId})` }}
        />

        {/* 3D Specular Highlight Overlay */}
        <ellipse
          cx="44"
          cy="38"
          rx="22"
          ry="17"
          fill="rgba(255, 255, 255, 0.25)"
          style={{ fill: `url(#${specId})` }}
        />

        {/* Subtle Rim Light Edge on bottom right */}
        <path
          d="M 68 70 C 62 82, 40 85, 30 82 C 45 87, 65 83, 72 68 Z"
          fill="#ffffff"
          opacity="0.22"
        />

        {/* --- COMPANION FACE (EYES, CHEEKS, SMILE) --- */}
        <g>
          {/* Left Eye */}
          <circle cx="39" cy="48" r="4.2" fill="#0f172a" />
          <circle cx="37.8" cy="46.5" r="1.6" fill="#ffffff" />
          <circle cx="40.5" cy="49.5" r="0.7" fill="#ffffff" />

          {/* Right Eye */}
          <circle cx="61" cy="48" r="4.2" fill="#0f172a" />
          <circle cx="59.8" cy="46.5" r="1.6" fill="#ffffff" />
          <circle cx="62.5" cy="49.5" r="0.7" fill="#ffffff" />

          {/* Cheeks - Rosy Blush */}
          <ellipse cx="32" cy="55" rx="4.5" ry="2.5" fill="#f43f5e" opacity="0.35" />
          <ellipse cx="68" cy="55" rx="4.5" ry="2.5" fill="#f43f5e" opacity="0.35" />

          {/* Sweet Happy Smile */}
          <path
            d="M 45 54 Q 50 61 55 54"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* --- OUTFIT ACCESSORIES (FOREGROUND) --- */}

        {/* 1. SCARF (Kışlık Atkı) */}
        {outfit === "scarf" && (
          <g>
            {/* Scarf loop around neck */}
            <path
              d="M 23 66 Q 50 78 77 66 Q 79 78 72 83 Q 50 89 28 83 Q 21 76 23 66 Z"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="1.2"
            />
            {/* Scarf knot/stripe accents */}
            <path
              d="M 33 73 Q 50 82 67 73"
              fill="none"
              stroke="#fef08a"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Hanging scarf tail */}
            <path
              d="M 54 75 L 52 95 Q 58 97 64 95 L 66 75 Z"
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="1"
            />
            {/* Fringe at end of scarf */}
            <line x1="53" y1="95" x2="53" y2="99" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="57" y1="96" x2="57" y2="100" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="61" y1="96" x2="61" y2="100" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="64" y1="95" x2="64" y2="99" stroke="#fef08a" strokeWidth="1.5" />
          </g>
        )}

        {/* 2. GLASSES (Akıllı Gözlük) */}
        {outfit === "glasses" && (
          <g>
            {/* Left rim */}
            <rect
              x="30"
              y="40"
              width="18"
              height="16"
              rx="4"
              fill="rgba(255, 255, 255, 0.2)"
              stroke="#0f172a"
              strokeWidth="2.2"
            />
            {/* Right rim */}
            <rect
              x="52"
              y="40"
              width="18"
              height="16"
              rx="4"
              fill="rgba(255, 255, 255, 0.2)"
              stroke="#0f172a"
              strokeWidth="2.2"
            />
            {/* Center bridge */}
            <path d="M 48 46 Q 50 43 52 46" fill="none" stroke="#0f172a" strokeWidth="2.2" />
            {/* Left temple */}
            <line x1="30" y1="46" x2="19" y2="44" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            {/* Right temple */}
            <line x1="70" y1="46" x2="81" y2="44" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            {/* Glass reflection streak */}
            <line x1="34" y1="43" x2="42" y2="51" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            <line x1="56" y1="43" x2="64" y2="51" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          </g>
        )}

        {/* 3. HEADPHONES (Stüdyo Kulaklık) */}
        {outfit === "headphones" && (
          <g>
            {/* Over-head headband */}
            <path
              d="M 18 52 C 16 16, 84 16, 82 52"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Headband padding cushion */}
            <path
              d="M 32 24 C 40 19, 60 19, 68 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Left Ear Cup */}
            <ellipse cx="18" cy="52" rx="5" ry="11" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
            <ellipse cx="18" cy="52" rx="2" ry="6" fill="#1e293b" />
            {/* Right Ear Cup */}
            <ellipse cx="82" cy="52" rx="5" ry="11" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
            <ellipse cx="82" cy="52" rx="2" ry="6" fill="#1e293b" />
          </g>
        )}

        {/* 4. GRADUATION HAT (Mezuniyet Şapkası) */}
        {outfit === "hat" && (
          <g>
            {/* Skull Cap Base */}
            <path
              d="M 33 26 Q 50 36 67 26 L 66 33 Q 50 41 34 33 Z"
              fill="#0f172a"
              stroke="#020617"
              strokeWidth="1"
            />
            {/* Mortarboard Diamond Top */}
            <polygon
              points="50,9 84,21 50,33 16,21"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Center button */}
            <circle cx="50" cy="21" r="2.5" fill="#facc15" />
            {/* Golden Tassel ribbon */}
            <path
              d="M 50 21 Q 38 23 27 31 L 26 44"
              fill="none"
              stroke="#facc15"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Tassel brush */}
            <polygon points="23,44 29,44 28,52 24,52" fill="#eab308" />
          </g>
        )}

        {/* 5. CROWN (Zafer Tacı) */}
        {outfit === "crown" && (
          <g>
            {/* Golden Crown */}
            <path
              d="M 26 31 L 30 15 L 41 23 L 50 10 L 59 23 L 70 15 L 74 31 Q 50 35 26 31 Z"
              fill="url(#comp-gold)"
              stroke="#b45309"
              strokeWidth="1.5"
            />
            {/* Crown base band */}
            <path
              d="M 26 31 Q 50 35 74 31 L 73 34 Q 50 38 27 34 Z"
              fill="#ca8a04"
            />
            {/* Ruby Gem in center */}
            <polygon points="50,19 53,23 50,27 47,23" fill="#ef4444" />
            {/* Emerald Gem on left */}
            <circle cx="36" cy="25" r="2.2" fill="#10b981" />
            {/* Sapphire Gem on right */}
            <circle cx="64" cy="25" r="2.2" fill="#3b82f6" />
          </g>
        )}

        {/* 6. CAPE (Kahraman Tokası - Göğüs Önü) */}
        {outfit === "cape" && (
          <g>
            {/* Golden collar clasp in front */}
            <circle cx="50" cy="74" r="4.5" fill="url(#comp-gold)" stroke="#b45309" strokeWidth="1" />
            <polygon points="50,71 52,74 50,77 48,74" fill="#ef4444" />
          </g>
        )}

        {/* 7. BANDANA (Odak Bandı) */}
        {outfit === "bandana" && (
          <g>
            {/* Headband wrapping the forehead */}
            <path
              d="M 19 36 Q 50 42 81 36 L 80 44 Q 50 50 20 44 Z"
              fill="#e11d48"
              stroke="#9f1239"
              strokeWidth="1"
            />
            {/* Center Focus Badge (White circle with dot) */}
            <circle cx="50" cy="43" r="3.2" fill="#ffffff" />
            <circle cx="50" cy="43" r="1.5" fill="#e11d48" />
            {/* Fluttering ribbon ties blowing on the right */}
            <path
              d="M 80 39 Q 94 40 98 49 Q 91 47 84 45 Q 94 50 97 62 Q 88 53 79 44 Z"
              fill="#be123c"
              stroke="#881337"
              strokeWidth="0.8"
            />
          </g>
        )}

        {/* --- LEVEL 5 ASTRAL RING (FOREGROUND TILT) --- */}
        {level >= 5 && (
          <ellipse
            cx="50"
            cy="56"
            rx="48"
            ry="16"
            fill="none"
            stroke="url(#comp-astral-ring)"
            strokeWidth="2.5"
            transform="rotate(-15 50 56)"
            strokeDasharray="160"
            strokeDashoffset="0"
            opacity="0.85"
          />
        )}
      </svg>
    </div>
  );
}
