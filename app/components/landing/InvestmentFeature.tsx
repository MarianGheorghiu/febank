import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import styles from "./landing.module.css";

export default function InvestmentFeature() {
    return (
        <article
            className={`${styles.featureCard} ${styles.investFeature}`}
            id="investments"
        >
            <div className={styles.featureTop}>
                <TrendingUp size={22} />
                <span>03 / INVEST</span>
            </div>
            <h3>
                Big ambitions.
                <br />A clearer picture.
            </h3>
            <p>
                Explore stocks and crypto alongside your
                everyday money. See the possibilities from a new
                angle.
            </p>
            <div className={styles.featureVisual}>
                <div
                    className={styles.portfolio}
                    aria-label="Illustrative portfolio chart"
                >
                    <div>
                        <span>Your portfolio</span>
                        <span>PREVIEW</span>
                    </div>
                    <strong>
                        $12,840<span>.00</span>
                    </strong>
                    <svg
                        viewBox="0 0 300 85"
                        fill="none"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient
                                id="portfolio-fill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    stopColor="#638dff"
                                    stopOpacity=".3"
                                />
                                <stop
                                    offset="1"
                                    stopColor="#638dff"
                                    stopOpacity="0"
                                />
                            </linearGradient>
                        </defs>
                        <path
                            d="M0 75L25 60L45 65L70 40L95 49L120 32L150 42L175 20L195 30L220 12L245 24L270 5L300 10V85H0Z"
                            fill="url(#portfolio-fill)"
                        />
                        <path
                            d="M0 75L25 60L45 65L70 40L95 49L120 32L150 42L175 20L195 30L220 12L245 24L270 5L300 10"
                            stroke="#83a5ff"
                            strokeWidth="2"
                        />
                    </svg>
                    <span className={styles.demoNote}>
                        Example data. Investment values can
                        change.
                    </span>
                </div>
            </div>
            <Link
                href="/auth/register"
                className={styles.featureLink}
            >
                Explore your possibilities{" "}
                <ArrowUpRight size={18} />
            </Link>
        </article>
    );
}
