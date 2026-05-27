import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${
        variant === "primary"
          ? "bg-gradient-to-r from-white to-gray-100 text-black hover:from-cyan-400 hover:to-cyan-300 shadow-lg shadow-white/5 hover:shadow-cyan-500/10"
          : "border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
      } ${props.className || ""}`}
    >
      {children}
    </button>
  );
}
