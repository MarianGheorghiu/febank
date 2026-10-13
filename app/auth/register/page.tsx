"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Eye, EyeOff, Lock, Mail, MapPin, Phone, User, UserPlus } from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    const form = event.currentTarget;
    const password = form.elements.namedItem("password") as HTMLInputElement;
    const confirmation = form.elements.namedItem("confirmPassword") as HTMLInputElement;
    confirmation.setCustomValidity(password.value === confirmation.value ? "" : "Passwords must match.");
    if (!form.reportValidity()) return;
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); router.push("/dashboard"); }, 2500);
  };

  return (
    <GlassCard className={`${styles.card} ${styles.registerCard}`}>
      <LoadingOverlay isLoading={isLoading} message="Creating your account..." />
      <div className={styles.cardHeading}><span className={styles.sectionIcon}><UserPlus size={21} /></span><span className={styles.eyebrow}>YOUR NEXT CHAPTER</span><h1>Make room for<br /><em>more possibilities.</em></h1><p>Let’s start with you. Create your MBANK profile below.</p></div>
      <form onSubmit={handleRegister} className={styles.form} aria-busy={isLoading}>
        <fieldset disabled={isLoading} className={styles.fields}><legend className={styles.fieldLegend}>Your details</legend><div className={styles.fieldGrid}>
          <Input label="First name" name="firstName" autoComplete="given-name" placeholder="First name" icon={<User size={17} />} required />
          <Input label="Last name" name="lastName" autoComplete="family-name" placeholder="Last name" icon={<User size={17} />} required />
          <Input label="Phone number" name="phone" type="tel" autoComplete="tel" placeholder="+40 712 345 678" icon={<Phone size={17} />} required />
          <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" icon={<Mail size={17} />} required />
          <Input label="Residential address" name="address" autoComplete="street-address" placeholder="Street and city" icon={<MapPin size={17} />} required />
          <div className={styles.selectField}><label htmlFor="identity">Gender / entity</label><div><select id="identity" name="identity" defaultValue="" required><option value="" disabled>Select identity</option><option value="male">Male</option><option value="female">Female</option><option value="institutional">Corporate / Institution</option></select><ChevronDown size={16} /></div></div>
        </div></fieldset>
        <fieldset disabled={isLoading} className={styles.fields}><legend className={styles.fieldLegend}>Your password</legend><div className={styles.fieldGrid}>
          <div className={styles.passwordField}><Input label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" onChange={event => { const confirmation = event.currentTarget.form?.elements.namedItem("confirmPassword") as HTMLInputElement | null; confirmation?.setCustomValidity(""); }} placeholder="New password" icon={<Lock size={17} />} className={styles.passwordInput} required /><button type="button" className={styles.reveal} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          <div className={styles.passwordField}><Input label="Confirm password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat password" icon={<Lock size={17} />} className={styles.passwordInput} onChange={event => event.target.setCustomValidity("")} required /><button type="button" className={styles.reveal} onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmPassword}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        </div></fieldset>
        <Button type="submit" disabled={isLoading} className={styles.submit}>{isLoading ? "Creating your account…" : "Create your MBANK account"}<ArrowRight size={17} /></Button>
      </form>
      <div className={styles.switchAccount}><span>Already part of MBANK?</span><Link href="/auth/login" aria-disabled={isLoading} tabIndex={isLoading ? -1 : undefined}>Log in to your account <ArrowRight size={15} /></Link></div>
    </GlassCard>
  );
}
