"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Menu, X } from "lucide-react";
import Brand from "./Brand";
import styles from "./landing.module.css";

const navigation = [
    { label: "Possibilities", href: "#possibilities" },
    { label: "Security", href: "#security" },
    { label: "Contact", href: "#contact" },
];

export default function LandingHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (!menuOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                menuButton.current?.focus();
            }
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [menuOpen]);

    return (
        <header className={styles.header}>
            <nav
                className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
                aria-label="Main navigation"
            >
                <Brand />
                <div className={styles.desktopLinks}>
                    {navigation.map((item) => (
                        <a key={item.href} href={item.href}>
                            {item.label}
                        </a>
                    ))}
                </div>
                <div className={styles.navActions}>
                    <Link
                        href="/auth/login"
                        className={styles.login}
                    >
                        Log in <ArrowUpRight size={15} />
                    </Link>
                    <Link
                        href="/auth/register"
                        className={styles.navCta}
                    >
                        Open account <ArrowUpRight size={14} />
                    </Link>
                </div>
                <button
                    ref={menuButton}
                    className={styles.menuButton}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={
                        menuOpen ? "Close menu" : "Open menu"
                    }
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu"
                >
                    {menuOpen ? (
                        <X size={23} />
                    ) : (
                        <Menu size={23} />
                    )}
                </button>
                {menuOpen && (
                    <div
                        className={styles.mobileMenu}
                        id="mobile-menu"
                    >
                        {navigation.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.label}
                                <ChevronRight size={17} />
                            </a>
                        ))}
                        <Link
                            href="/auth/login"
                            onClick={() => setMenuOpen(false)}
                        >
                            Log in <ArrowUpRight size={17} />
                        </Link>
                        <Link
                            href="/auth/register"
                            onClick={() => setMenuOpen(false)}
                        >
                            Open account <ArrowUpRight size={17} />
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    );
}
