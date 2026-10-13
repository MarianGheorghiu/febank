import Link from "next/link";
import { ArrowUpRight, Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";
import styles from "./landing.module.css";

export default function Security() {
    return (
        <section
            className={`${styles.container} ${styles.security}`}
            id="security"
        >
            <div className={styles.securityVisual} aria-hidden="true">
                <div className={styles.securityOrbit} />
                <div className={styles.securityOrbit} />
                <div className={styles.fingerprint}>
                    <Fingerprint strokeWidth={0.8} />
                </div>
                <span className={styles.securityTag}>
                    <span /> YOUR WORLD. IN SAFE HANDS.
                </span>
                <span className={styles.securityBadge}>
                    <LockKeyhole size={15} /> Confidence, built in.
                </span>
            </div>
            <div className={styles.securityCopy}>
                <span className={styles.sectionLabel}>
                    02 — CONFIDENCE BY DESIGN
                </span>
                <h2>
                    Possibility, without
                    <br />
                    <em>the second thoughts.</em>
                </h2>
                <p>
                    Your money deserves a clear view. Stay connected to
                    your account, manage your cards, and keep every move
                    in sight.
                </p>
                <div className={styles.securityItems}>
                    <div>
                        <LockKeyhole size={21} />
                        <div>
                            <h3>Control that stays with you.</h3>
                            <p>
                                Manage card status and spending limits
                                from your account.
                            </p>
                        </div>
                    </div>
                    <div>
                        <ShieldCheck size={21} />
                        <div>
                            <h3>A clearer view. A calmer mind.</h3>
                            <p>
                                Review your transactions and
                                notifications in one place.
                            </p>
                        </div>
                    </div>
                </div>
                <Link
                    href="/auth/register"
                    className={styles.textButton}
                >
                    Make yourself at home <ArrowUpRight size={17} />
                </Link>
            </div>
        </section>
    );
}
