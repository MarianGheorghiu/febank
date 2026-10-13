import { ArrowUpRight, CreditCard, Globe2, TrendingUp, ShieldCheck } from "lucide-react";
import styles from "./landing.module.css";

export default function ServiceOverview() {
    return (
        <div
            className={`${styles.container} ${styles.introStrip}`}
            aria-label="Explore MBANK services"
        >
            <a href="#cards">
                <span className={styles.benefitIcon}>
                    <CreditCard size={23} />
                </span>
                <div>
                    <strong>Cards that keep up</strong>
                    <p>Virtual cards & spending controls</p>
                </div>
                <ArrowUpRight size={17} />
            </a>
            <a href="#currencies">
                <span className={styles.benefitIcon}>
                    <Globe2 size={23} />
                </span>
                <div>
                    <strong>Money without borders</strong>
                    <p>Multiple currencies. One account.</p>
                </div>
                <ArrowUpRight size={17} />
            </a>
            <a href="#investments">
                <span className={styles.benefitIcon}>
                    <TrendingUp size={23} />
                </span>
                <div>
                    <strong>Your next investment</strong>
                    <p>Stocks, crypto & portfolio insights</p>
                </div>
                <ArrowUpRight size={17} />
            </a>
            <a href="#security">
                <span className={styles.benefitIcon}>
                    <ShieldCheck size={23} />
                </span>
                <div>
                    <strong>Control, built in</strong>
                    <p>Card limits & account activity</p>
                </div>
                <ArrowUpRight size={17} />
            </a>
        </div>
    );
}
