import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CreditCard, Globe2, Landmark, ShieldCheck, Wifi } from "lucide-react";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="MBANK home"><span><Landmark size={21} /></span>MBANK<sup>®</sup></Link>
        <Link href="/" className={styles.back}><ArrowLeft size={15} /> Back to home</Link>
      </header>
      <main className={styles.content}>
        <aside className={styles.story} aria-label="The MBANK experience">
          <span className={styles.eyebrow}>A BRIGHTER WAY TO BANK</span>
          <h2>Your world.<br /><em>More limitless.</em></h2>
          <p>One connected space for your everyday money, your next adventure, and your bigger ambitions.</p>
          <div className={styles.artwork}>
            <div className={styles.orbit} aria-hidden="true" />
            <div className={styles.previewCard} aria-label="MBANK virtual card illustration">
              <div><span><Landmark size={15} /> MBANK</span><Wifi size={21} /></div>
              <div className={styles.cardRings} aria-hidden="true"><i /><i /><i /></div>
              <div><span>•••• 8824<small>YOUR WORLD. UNLOCKED.</small></span><strong>VISA<small>DEBIT</small></strong></div>
            </div>
            <div className={styles.floatingChip}><Globe2 size={17} /><span>One account.<strong>A world of possibilities.</strong></span><ArrowUpRight size={15} /></div>
          </div>
          <div className={styles.storyBenefits}><span><CreditCard size={17} /> Cards & currencies</span><span><ShieldCheck size={17} /> You’re in control</span></div>
        </aside>
        <div className={styles.formColumn}>{children}</div>
      </main>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} MBANK</span><span>Made for a life in motion.</span><Link href="/#contact">Contact MBANK <ArrowUpRight size={13} /></Link></footer>
    </div>
  );
}
