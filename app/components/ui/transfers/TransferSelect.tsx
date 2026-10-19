import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export default function TransferSelect({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block min-w-0">
      <select {...props} className={`appearance-none cursor-pointer pr-10 disabled:cursor-not-allowed ${className}`}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300" />
    </span>
  );
}
