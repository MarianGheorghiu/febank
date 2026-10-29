import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../dashboard/OverviewControls.module.css";

export function ControlLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return <Link href={href} className={`${styles.action} inline-flex min-h-8 w-auto max-w-full min-w-0 cursor-pointer items-center justify-center gap-2 border px-5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide`}><span aria-hidden className="flex shrink-0 text-cyan-300">{icon}</span><span className="min-w-0 text-center [overflow-wrap:anywhere] sm:whitespace-nowrap">{children}</span></Link>;
}
