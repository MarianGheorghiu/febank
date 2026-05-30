// app/components/ui/ActionButton.tsx
import React from "react";

// 1. Adăugăm "indigo" aici
type ButtonVariant = "cyan" | "rose" | "amber" | "purple";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  icon: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  cyan: "text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.02)]",
  rose: "text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-400/40 shadow-[0_0_15px_rgba(244,63,94,0.02)]",
  amber:
    "text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 hover:border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.02)]",
  // Noua culoare Premium vibrantă:
  purple:
    "text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 hover:border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.05)]",
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  icon,
  children,
  ...props
}) => (
  <button
    className={`flex items-center justify-center gap-2 px-4 py-3 sm:px-4 sm:py-2.5 text-xs sm:text-[11px] font-black font-mono tracking-wide border rounded-xl transition-all active:scale-[0.98] sm:active:scale-95 cursor-pointer w-full sm:w-auto ${variantStyles[variant]}`}
    {...props}
  >
    {icon}
    {children}
  </button>
);
