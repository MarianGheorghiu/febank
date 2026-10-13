import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import BalancePreview from "./BalancePreview";
import LandingHeader from "./LandingHeader";
import styles from "./landing.module.css";

export default function Hero() {
    return (
        <section
            className={styles.hero}
            id="experience"
            aria-labelledby="hero-title"
        >
            <div className={styles.heroArtwork} aria-hidden="true" />
            <LandingHeader />
            <div className={styles.heroContent}>
                <div className={styles.heroCopy}>
                    <div className={styles.eyebrow}>
                        <span /> A BRIGHTER WAY TO BANK
                    </div>
                    <h1 id="hero-title">
                        Your future.
                        <br />A little <em>more limitless.</em>
                    </h1>
                    <p>
                        Move beyond ordinary banking. Spend, send, and
                        invest with a world of possibilities at your
                        fingertips.
                    </p>
                    <div className={styles.heroActions}>
                        <Link
                            href="/auth/register"
                            className={styles.primaryButton}
                        >
                            Step into MBANK <ArrowUpRight size={17} />
                        </Link>
                        <a
                            href="#possibilities"
                            className={styles.textButton}
                        >
                            Discover the difference{" "}
                            <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
                <BalancePreview />
            </div>
            <div className={styles.heroBottom}>
                <a href="#possibilities">
                    <span className={styles.scrollIcon}>
                        <ArrowDown size={18} />
                    </span>
                    <span>
                        Discover MBANK
                        <small>Cards, currencies & investments</small>
                    </span>
                </a>
                <div>
                    <span className={styles.heroBottomLine} />
                    <span>One account. Everything connected.</span>
                    <Link href="/auth/register">
                        Get started <ArrowUpRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
