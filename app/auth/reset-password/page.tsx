"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import styles from "../auth.module.css";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [requestComplete, setRequestComplete] = useState(false);
  const handleReset = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    setRequestComplete(false);
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setRequestComplete(true); }, 2500);
  };

  return (
    <GlassCard className={styles.card}>
      <LoadingOverlay isLoading={isLoading} message="Processing your request..." />
      <div className={styles.cardHeading}><span className={styles.sectionIcon}><KeyRound size={22} /></span><span className={styles.eyebrow}>LET’S GET YOU BACK IN</span><h1>A fresh start.<br /><em>Same possibilities.</em></h1><p>Forgot your password? Enter the email associated with your MBANK account to request a reset link.</p></div>
      <form onSubmit={handleReset} className={styles.form} aria-busy={isLoading}>
        <Input label="Account email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" icon={<Mail size={17} />} disabled={isLoading} required />
        <div className={styles.recoveryNote}><Mail size={19} /><p>Use the email you registered with. If a recovery email arrives, check your spam folder too.</p></div>
        {requestComplete && <p role="status" className={styles.status}>Demo request completed. Email delivery is not connected yet, so no reset email was sent.</p>}
        <Button type="submit" disabled={isLoading} className={styles.submit}>{isLoading ? "Processing request…" : "Send reset link"}<ArrowRight size={17} /></Button>
      </form>
      <div className={styles.switchAccount}><span>Remember your password?</span><Link href="/auth/login" aria-disabled={isLoading} tabIndex={isLoading ? -1 : undefined}><ArrowLeft size={15} /> Back to log in</Link></div>
    </GlassCard>
  );
}
