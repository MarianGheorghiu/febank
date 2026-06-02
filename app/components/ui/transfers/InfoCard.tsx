// app/components/ui/MetricCard.tsx
import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface InfoCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  glowColor?: string;
  subtext?: React.ReactNode;
  href?: string;
}

export default function InfoCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-400",
  glowColor = "hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
  subtext,
  href,
}: InfoCardProps) {
  // Am aplicat exact estetica de la TransferForm: #0a1024, backdrop-blur și border fin
  // Am redus padding-ul (p-3.5) și am forțat o înălțime mai compactă
  const CardContent = (
    <div
      className={`relative bg-[#0a1024] border border-blue-500/20 sm:backdrop-blur-xl rounded-xl p-3.5 sm:p-4 transition-all duration-300 group ${glowColor} flex flex-col justify-between h-full min-h-[100px] overflow-hidden`}
    >
      {/* Background Hover Glow (opțional, dă un efect premium la trecerea mouse-ului) */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" />

      {/* HEADER: Titlu și Iconiță */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        {/* Folosim același stil de label ca la input-urile din form */}
        <h3 className="text-[11px] font-bold font-mono text-blue-300/80 uppercase tracking-widest">
          {title}
        </h3>
        <div
          className={`p-1.5 rounded-lg bg-[#02040f] border border-blue-500/10 ${iconColor}`}
        >
          <Icon size={14} />
        </div>
      </div>

      {/* BODY: Valoarea și Subtextul */}
      <div className="relative z-10 mt-auto">
        <p className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
          {value}
        </p>
        {subtext && (
          <div className="text-[10px] sm:text-[11px] opacity-90">{subtext}</div>
        )}
      </div>
    </div>
  );

  // Dacă are link, îl împachetăm într-un <a> (via Next Link), altfel afișăm doar cardul
  if (href) {
    return (
      <Link
        href={href}
        className="block h-full cursor-pointer active:scale-[0.98] transition-transform"
      >
        {CardContent}
      </Link>
    );
  }

  return <div className="h-full">{CardContent}</div>;
}
