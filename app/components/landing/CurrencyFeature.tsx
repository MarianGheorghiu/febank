import Link from "next/link";
import { ArrowUpRight, Check, Globe2 } from "lucide-react";
import styles from "./landing.module.css";

export default function CurrencyFeature() {
    return (
        <article
            className={`${styles.featureCard} ${styles.worldFeature}`}
            id="currencies"
        >
            <div className={styles.featureTop}>
                <Globe2 size={22} />
                <span>02 / SEND</span>
            </div>
            <h3>
                Less distance.
                <br />
                More connection.
            </h3>
            <p>
                Keep currencies together and explore
                international transfers. Your plans don’t stop
                at borders.
            </p>
            <div className={styles.featureVisual}>
                <div className={styles.currencyVisual}>
                    {[
                        {
                            sign: "$",
                            code: "USD",
                            name: "US Dollar",
                        },
                        {
                            sign: "€",
                            code: "EUR",
                            name: "Euro",
                        },
                        {
                            sign: "£",
                            code: "GBP",
                            name: "British Pound",
                        },
                    ].map((currency) => (
                        <div key={currency.code}>
                            <span>{currency.sign}</span>
                            <strong>{currency.code}</strong>
                            <small>{currency.name}</small>
                            <Check size={14} />
                        </div>
                    ))}
                </div>
            </div>
            <Link
                href="/auth/register"
                className={styles.featureLink}
            >
                Open up your world <ArrowUpRight size={18} />
            </Link>
        </article>
    );
}
