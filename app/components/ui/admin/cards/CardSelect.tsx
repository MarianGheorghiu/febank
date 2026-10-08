import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { inputClass } from "./presentation";

export default function CardSelect({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="relative block min-w-0">
    <select {...props} className={`${inputClass} min-h-11 appearance-none pr-10 cursor-pointer ${className}`}>{children}</select>
    <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300" />
  </span>;
}
