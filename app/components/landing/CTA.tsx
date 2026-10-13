import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, Mail, Phone } from "lucide-react";
import styles from "./landing.module.css";

export default function CTA() {
    return (
        <section
            className={`${styles.container} ${styles.closing}`}
            id="contact"
            aria-labelledby="contact-title"
        >
            <div className={styles.onboarding}>
                <span className={styles.sectionLabel}>
                    03 — YOUR NEXT CHAPTER
                </span>
                <h2 id="contact-title">
                    More possibilities.
                    <br />
                    <em>One MBANK account.</em>
                </h2>
                <p>
                    Bring your cards, international transfers, stocks,
                    and crypto into one financial overview.
                </p>
                <ol className={styles.onboardingSteps}>
                    <li>
                        <span>01</span>
                        <div>
                            <strong>Create your profile</strong>
                            <p>
                                Start with your details and account
                                preferences.
                            </p>
                        </div>
                    </li>
                    <li>
                        <span>02</span>
                        <div>
                            <strong>Make it yours</strong>
                            <p>
                                Explore cards, currencies, and
                                investment tools.
                            </p>
                        </div>
                    </li>
                    <li>
                        <span>03</span>
                        <div>
                            <strong>Stay in the picture</strong>
                            <p>
                                Track balances, transactions, and
                                notifications.
                            </p>
                        </div>
                    </li>
                </ol>
                <Link
                    href="/auth/register"
                    className={styles.primaryButton}
                >
                    Open your MBANK account <ArrowUpRight size={18} />
                </Link>
            </div>
            <div className={styles.contactPanel}>
                <div className={styles.contactHeading}>
                    <span className={styles.benefitIcon}>
                        <Mail size={22} />
                    </span>
                    <div>
                        <h3>Let’s talk about your next move.</h3>
                        <p>Already a member or just getting started?</p>
                    </div>
                </div>
                <a
                    href="mailto:concierge@mbank.fi"
                    className={styles.contactRow}
                >
                    <Mail size={20} />
                    <span>
                        <small>Email our concierge</small>
                        <strong>concierge@mbank.fi</strong>
                    </span>
                    <ArrowUpRight size={17} />
                </a>
                <a
                    href="tel:+18006226539"
                    className={styles.contactRow}
                >
                    <Phone size={20} />
                    <span>
                        <small>Call the MBANK desk</small>
                        <strong>+1 (800) MBANK-FX</strong>
                    </span>
                    <ArrowUpRight size={17} />
                </a>
                <div className={styles.contactRow}>
                    <Clock size={20} />
                    <span>
                        <small>Your digital account</small>
                        <strong>Access online, around the clock</strong>
                    </span>
                </div>
                <div className={styles.existingMember}>
                    <span>Already part of MBANK?</span>
                    <Link href="/auth/login">
                        Log in to your account <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
