import { ReactNode } from "react";

export default function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-b from-white/[0.14] to-white/[0.02] backdrop-blur-3xl border border-white/[0.22] rounded-[2rem] p-8 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.7)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
