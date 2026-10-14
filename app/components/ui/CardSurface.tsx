import type { HTMLAttributes } from "react";

export type CardTone = "cyan" | "purple" | "blue" | "amber";
const tones = {
  cyan: { color: "#22d3ee", background: "from-cyan-500/10", hover: "hover:border-cyan-400/50 hover:shadow-[0_12px_40px_rgba(34,211,238,0.16)] focus-within:border-cyan-400/50" },
  purple: { color: "#c084fc", background: "from-purple-500/10", hover: "hover:border-purple-400/50 hover:shadow-[0_12px_40px_rgba(168,85,247,0.18)] focus-within:border-purple-400/50" },
  blue: { color: "#60a5fa", background: "from-blue-500/10", hover: "hover:border-blue-400/50 hover:shadow-[0_12px_40px_rgba(59,130,246,0.18)] focus-within:border-blue-400/50" },
  amber: { color: "#fbbf24", background: "from-amber-500/10", hover: "hover:border-amber-400/50 hover:shadow-[0_12px_40px_rgba(245,158,11,0.16)] focus-within:border-amber-400/50" },
};

/** Shared overview surface. Hover changes only light, border and shadow. */
export default function CardSurface({ tone = "blue", as: Tag = "div", className = "", children, ...props }: HTMLAttributes<HTMLElement> & { tone?: CardTone; as?: "div" | "section" }) {
  const theme = tones[tone];
  return <Tag {...props} className={`group relative isolate min-w-0 rounded-2xl border border-white/10 bg-gradient-to-b ${theme.background} to-[#080f20] shadow-lg transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none ${theme.hover} ${className}`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-25 motion-reduce:transition-none" style={{ backgroundColor: theme.color }} />
    </div>
    {children}
  </Tag>;
}
