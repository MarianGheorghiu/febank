import Link from "next/link";
import { ArrowUpRight, CreditCard, Landmark, Wifi } from "lucide-react";
import styles from "./landing.module.css";

export default function CardFeature() {
    return (
        <article
            className={`${styles.featureCard} ${styles.cardFeature}`}
            id="cards"
        >
            <div className={styles.featureTop}>
                <CreditCard size={22} />
                <span>01 / SPEND</span>
            </div>
            <h3>
                Exceptional.
                <br />
                Even in the everyday.
            </h3>
            <p>
                Your virtual card. Your spending controls. A
                little more possibility in every payment.
            </p>
            <div className={styles.featureVisual}>
                <div
                    className={styles.virtualCard}
                    aria-label="MBANK virtual debit card preview"
                >
                    <div>
                        <span>
                            <Landmark size={15} /> MBANK
                        </span>
                        <Wifi size={20} />
                    </div>
                    <div
                        className={styles.cardRings}
                        aria-hidden="true"
                    >
                        <i />
                        <i />
                        <i />
                    </div>
                    <div className={styles.cardDetails}>
                        <span>
                            •••• 8824
                            <small>YOUR WORLD. UNLOCKED.</small>
                        </span>
                        <strong>
                            VISA<small>DEBIT</small>
                        </strong>
                    </div>
                </div>
            </div>
            <Link
                href="/auth/register"
                className={styles.featureLink}
            >
                Find your everyday advantage{" "}
                <ArrowUpRight size={18} />
            </Link>
        </article>
    );
}
