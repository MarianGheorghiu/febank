"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import { useUser } from "@/app/context/UserContext";
import styles from "../auth.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading || !email || !password) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const prefix = email.split("@")[0];
      login(email, prefix.charAt(0).toUpperCase() + prefix.slice(1));
    }, 2500);
  };

  return (
    <GlassCard className={styles.card}>
      <LoadingOverlay isLoading={isLoading} message="Signing you in..." />
      <div className={styles.cardHeading}><span className={styles.sectionIcon}><Lock size={21} /></span><span className={styles.eyebrow}>YOUR MBANK ACCOUNT</span><h1>Good to see<br /><em>you again.</em></h1><p>Your money, your plans, your next move. Pick up where you left off.</p></div>
      <form onSubmit={handleLogin} className={styles.form} aria-busy={isLoading}>
        <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" icon={<Mail size={17} />} value={email} onChange={event => setEmail(event.target.value)} disabled={isLoading} required />
        <div className={styles.passwordField}>
          <Input label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" icon={<Lock size={17} />} className={styles.passwordInput} value={password} onChange={event => setPassword(event.target.value)} disabled={isLoading} required />
          <button type="button" className={styles.reveal} onClick={() => setShowPassword(!showPassword)} disabled={isLoading} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        <div className={styles.formOptions}><span><ShieldCheck size={14} /> Your space. Your control.</span><Link href="/auth/reset-password" aria-disabled={isLoading} tabIndex={isLoading ? -1 : undefined}>Forgot password?</Link></div>
        <Button type="submit" disabled={isLoading} className={styles.submit}>{isLoading ? "Signing you in…" : "Log in to MBANK"}<ArrowRight size={17} /></Button>
      </form>
      <div className={styles.switchAccount}><span>New to MBANK?</span><Link href="/auth/register" aria-disabled={isLoading} tabIndex={isLoading ? -1 : undefined}>Open your account <ArrowRight size={15} /></Link></div>
    </GlassCard>
  );
}
