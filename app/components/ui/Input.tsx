import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
}

export default function Input({ label, icon, ...props }: InputProps) {
  return (
    <div className="flex flex-col space-y-2 w-full text-left">
      <label className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-200 pl-1">
        {label}
      </label>
      <div className="relative flex items-center w-full group">
        {icon && (
          <div className="absolute left-4 text-gray-300 group-focus-within:text-cyan-400 transition-colors pointer-events-none z-10">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-white/[0.05] border border-white/[0.15] rounded-xl py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/60 focus:bg-white/[0.09] focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 font-semibold ${
            icon ? "pl-12" : "px-4"
          } ${props.className || ""}`}
        />
      </div>
    </div>
  );
}
