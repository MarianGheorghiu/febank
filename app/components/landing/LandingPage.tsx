import CTA from "./CTA";
import Features from "./Features";
import Hero from "./Hero";
import LandingFooter from "./LandingFooter";
import Security from "./Security";
import ServiceOverview from "./ServiceOverview";
import styles from "./landing.module.css";

export default function LandingPage() {
    return (
        <div className={styles.landing}>
            <a className={styles.skipLink} href="#main-content">
                Skip to content
            </a>
            <main id="main-content" tabIndex={-1}>
                <Hero />
                <ServiceOverview />
                <Features />
                <Security />
                <CTA />
            </main>
            <LandingFooter />
        </div>
    );
}
