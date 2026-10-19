import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ActionButtonVariant = "cyan" | "rose" | "red" | "amber" | "purple" | "blue";
interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ActionButtonVariant;
  icon?: ReactNode;
  iconGap?: "tight" | "normal";
  /** Apply responsive visibility to the label wrapper without leaving an empty flex item. */
  labelClassName?: string;
  fullWidth?: boolean;
  compact?: boolean;
  size?: "normal" | "medium" | "small";
  autoWidth?: boolean;
}

const themes: Record<ActionButtonVariant, { color: string; classes: string }> = {
  cyan: { color: "#22d3ee", classes: "from-cyan-500/10 text-cyan-300 enabled:hover:border-cyan-400/40 enabled:hover:shadow-[0_8px_24px_rgba(34,211,238,0.12)] focus-visible:outline-cyan-300" },
  rose: { color: "#fb7185", classes: "from-rose-500/10 text-rose-300 enabled:hover:border-rose-400/40 enabled:hover:shadow-[0_8px_24px_rgba(244,63,94,0.12)] focus-visible:outline-rose-300" },
  red: { color: "#f87171", classes: "from-red-500/10 text-red-300 enabled:hover:border-red-400/40 enabled:hover:shadow-[0_8px_24px_rgba(239,68,68,0.12)] focus-visible:outline-red-300" },
  amber: { color: "#fbbf24", classes: "from-amber-500/10 text-amber-300 enabled:hover:border-amber-400/40 enabled:hover:shadow-[0_8px_24px_rgba(245,158,11,0.12)] focus-visible:outline-amber-300" },
  purple: { color: "#c084fc", classes: "from-purple-500/10 text-purple-300 enabled:hover:border-purple-400/40 enabled:hover:shadow-[0_8px_24px_rgba(168,85,247,0.12)] focus-visible:outline-purple-300" },
  blue: { color: "#60a5fa", classes: "from-blue-500/10 text-blue-300 enabled:hover:border-blue-400/40 enabled:hover:shadow-[0_8px_24px_rgba(59,130,246,0.12)] focus-visible:outline-blue-300" },
};

/** Card-style action surface shared by overview actions and operation dialogs. */
export function ActionButton({ variant, icon, iconGap = "normal", labelClassName = "", children, fullWidth = false, compact = false, size = "normal", autoWidth = false, type = "button", className = "", ...props }: ActionButtonProps) {
  const theme = themes[variant];
  return <button {...props} type={type} className={`group/action relative isolate flex ${size === "small" ? "min-h-8" : size === "medium" ? "min-h-9" : "min-h-11"} min-w-0 items-center justify-center ${iconGap === "tight" ? "gap-1" : "gap-2"} overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b to-[#080f20] font-mono font-bold uppercase tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-[border-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer motion-reduce:transition-none ${fullWidth ? "w-full" : autoWidth ? "w-auto" : "w-full sm:w-auto"} ${size === "small" ? "px-2 py-1.5 text-[10px]" : size === "medium" ? "px-2 py-1.5 text-[11px]" : compact ? "px-2 py-2 text-[11px]" : "px-3 py-2.5 text-xs sm:text-[11px]"} ${theme.classes} ${className}`}>
    <span aria-hidden="true" className="pointer-events-none absolute -top-8 -right-8 -z-10 h-24 w-24 rounded-full opacity-10 blur-xl transition-opacity duration-300 group-hover/action:opacity-20 group-disabled/action:opacity-10 motion-reduce:transition-none" style={{ backgroundColor: theme.color }} />
    {icon && <span aria-hidden="true" className="relative flex shrink-0 items-center justify-center">{icon}</span>}
    {children != null && <span className={`relative ${labelClassName}`}>{children}</span>}
  </button>;
}
