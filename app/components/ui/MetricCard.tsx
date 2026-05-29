// app/components/ui/MetricCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import GlassCard from "./GlassCard";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: React.ReactNode;
  icon: LucideIcon;
  iconColor?: string;
  glowColor?: string;
  href?: string;
}

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = "text-blue-400",
  glowColor = "hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(30,64,175,0.2)]",
  href,
}: MetricCardProps) {
  const CardContent = (
    <GlassCard
      className={`!p-6 space-y-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer group border border-white/5 bg-slate-950/20 backdrop-blur-xl ${glowColor}`}
    >
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest group-hover:text-gray-200 transition-colors">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors border border-white/5">
          <Icon
            size={18}
            className={`${iconColor} group-hover:scale-110 transition-transform`}
          />
        </div>
      </div>
      <div>
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
          {value}
        </h3>
        {subtext && <div className="mt-2 text-[11px]">{subtext}</div>}
      </div>
    </GlassCard>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
