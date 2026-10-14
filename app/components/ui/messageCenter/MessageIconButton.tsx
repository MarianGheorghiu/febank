import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ActionButton } from "../dashboard/ActionButton";
export default function MessageIconButton({ label, icon, danger = false, compact = false, className = "", style, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: ReactNode; danger?: boolean; compact?: boolean }) {
  const dimension = compact ? 28 : 32;
  return <ActionButton {...props} variant={danger ? "red" : "blue"} size="small" autoWidth aria-label={label} title={label} icon={icon} className={`shrink-0 ${className}`} style={{ width: dimension, height: dimension, minHeight: dimension, padding: 0, ...style }} />;
}
