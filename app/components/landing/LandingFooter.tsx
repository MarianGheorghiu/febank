import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import Brand from "./Brand";
import styles from "./landing.module.css";

export default function LandingFooter() {
    return (
        <footer className={`${styles.container} ${styles.footer}`}>
            <div className={styles.footerTop}>
                <div className={styles.footerBrand}>
                    <Brand />
                    <p>
                        A connected home for your everyday money, global
                        transfers, and investments.
                    </p>
                    <Link
                        href="/auth/register"
                        className={styles.footerCta}
                    >
                        Open an account <ArrowUpRight size={16} />
                    </Link>
                </div>
                <div className={styles.footerColumn}>
                    <h3>Explore MBANK</h3>
                    <a href="#cards">Virtual cards</a>
                    <a href="#currencies">Currencies & transfers</a>
                    <a href="#investments">Stocks & crypto</a>
                    <a href="#security">Security & controls</a>
                </div>
                <div className={styles.footerColumn}>
                    <h3>Your account</h3>
                    <Link href="/auth/register">Get started</Link>
                    <Link href="/auth/login">Log in</Link>
                    <Link href="/auth/reset-password">Reset password</Link>
                    <a href="#contact">Contact the team</a>
                </div>
                <div className={styles.footerColumn}>
                    <h3>Stay connected</h3>
                    <a href="mailto:concierge@mbank.fi">
                        concierge@mbank.fi
                    </a>
                    <a href="tel:+18006226539">+1 (800) MBANK-FX</a>
                    <p>
                        Cards, currencies, and portfolio insights. All in
                        one place.
                    </p>
                </div>
            </div>
            <div className={styles.footerBottom}>
                <div>
                    <span>
                        © {new Date().getFullYear()} MBANK. All rights
                        reserved.
                    </span>
                    <span>
                        Product preview. Balances and cards shown are
                        illustrative.
                    </span>
                </div>
                <a href="#experience" className={styles.backToTop}>
                    Back to top{" "}
                    <span>
                        <ArrowUp size={18} />
                    </span>
                </a>
            </div>
        </footer>
    );
}
