import CardFeature from "./CardFeature";
import CurrencyFeature from "./CurrencyFeature";
import InvestmentFeature from "./InvestmentFeature";
import styles from "./landing.module.css";

export default function Features() {
    return (
        <section
            className={`${styles.container} ${styles.features}`}
            id="possibilities"
        >
            <div className={styles.sectionHeading}>
                <div>
                    <span className={styles.sectionLabel}>
                        01 — THE MBANK EXPERIENCE
                    </span>
                    <h2>
                        Not just banking.
                        <br />
                        <em>Your next advantage.</em>
                    </h2>
                </div>
                <p>
                    One intuitive space for everything your money can
                    do. Less standing still. More moving forward.
                </p>
            </div>
            <div className={styles.featureGrid}>
                <CardFeature />
                <CurrencyFeature />
                <InvestmentFeature />
            </div>
        </section>
    );
}
