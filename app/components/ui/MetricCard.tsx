// app/components/ui/MetricCard.tsx
"use client";

import React from "react";
import CardSurface, { type CardTone } from "./CardSurface";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  glowColor?: string;
  subtext?: React.ReactNode;
  href?: string;
  compact?: boolean;
  tone?: CardTone;
  /** Higher-contrast reporting typography for dense management dashboards. */
  readable?: boolean;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-400",
  glowColor = "hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
  subtext,
  href,
  compact = false,
  tone,
  readable = false,
}: MetricCardProps) {
  const content = <>
      {/* HEADER: Titlu și Iconiță */}
      <div className={`relative z-10 flex justify-between ${compact ? "items-start gap-2 mb-1" : "items-center mb-2"}`}>
        <h3 className={`${compact ? "text-[9px] sm:text-[10px] tracking-wider" : "text-[11px] tracking-widest"} ${readable ? "min-h-8" : ""} font-bold font-mono text-blue-300/80 uppercase`}>
          {title}
        </h3>
        <div
          className={`${compact ? "p-1" : "p-1.5"} shrink-0 rounded-lg bg-[#02040f] border border-blue-500/10 transition-colors group-hover:border-blue-500/30 ${iconColor}`}
        >
          <Icon
            size={14}
            className={tone ? "" : "group-hover:scale-105 transition-transform"}
          />
        </div>
      </div>

      {/* BODY: Valoare și Subtext */}
      <div className={`relative z-10 ${readable ? "mt-2 flex flex-1 flex-col" : "mt-auto"}`}>
        <p className={`${compact ? "text-xl" : "text-xl sm:text-2xl"} font-black text-white tracking-tight mb-1 font-mono break-words`}>
          {value}
        </p>
        {subtext && (
          <div className={`${readable ? "text-[11px] text-slate-300 leading-relaxed" : compact ? "text-[9px] sm:text-[10px] text-gray-400/80 leading-normal" : "text-[10px] sm:text-[11px] text-gray-400/80 leading-normal"}`}>
            {subtext}
          </div>
        )}
      </div>
    </>;
  const spacing = `${compact ? "p-3 sm:p-3.5 min-h-[92px]" : "p-3.5 sm:p-4 min-h-[100px]"} flex flex-col justify-between h-full overflow-hidden`;
  const CardContent = tone ? <CardSurface tone={tone} className={spacing}>{content}</CardSurface> : (
    <div className={`relative bg-[#0a1024] border border-blue-500/20 sm:backdrop-blur-xl rounded-xl transition-all duration-300 group ${glowColor} ${spacing}`}>
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" />
      {content}
    </div>
  );

  // Dacă are link, aplicăm comportamentul de click + un subtil efect de apăsare (active:scale)
  if (href) {
    return (
      <Link
        href={href}
        className={`block min-w-0 h-full cursor-pointer ${tone ? "" : "active:scale-[0.99] transition-transform"}`}
      >
        {CardContent}
      </Link>
    );
  }

  return <div className="min-w-0 h-full">{CardContent}</div>;
}
