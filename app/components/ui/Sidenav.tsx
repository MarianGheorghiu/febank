"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserProps } from "@/app/lib/types/auth";
import { useUser } from "@/app/context/UserContext";
import {
    Landmark,
    LayoutDashboard,
    ArrowLeftRight,
    Users,
    Coins,
    Bitcoin,
    TrendingUp,
    CreditCard,
    Banknote,
    Sparkles,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    ShieldAlert,
    Bell,
    Fingerprint,
    Percent,
    FileText,
    Sliders,
    ActivityIcon,
    Gem,
    Megaphone,
} from "lucide-react";
import styles from "./Sidenav.module.css";
import { ActionButton } from "./dashboard/ActionButton";

export default function Sidenav({ user }: { user: UserProps }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const pathname = usePathname();
    const { logout } = useUser();

    const mobileDialog = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = mobileDialog.current;
        if (!dialog) return;
        if (!isMobileOpen) {
            dialog.close();
            return;
        }
        dialog.showModal();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const desktop = window.matchMedia("(min-width: 768px)");
        const closeOnDesktop = () => { if (desktop.matches) setIsMobileOpen(false); };
        desktop.addEventListener("change", closeOnDesktop);
        closeOnDesktop();
        return () => {
            document.body.style.overflow = previousOverflow;
            desktop.removeEventListener("change", closeOnDesktop);
            dialog.close();
        };
    }, [isMobileOpen]);

    const clientNavItems = [
        {
            name: "Overview",
            href: "/dashboard",
            icon: <LayoutDashboard size={18} />,
        },
        {
            name: "Message Center",
            href: "/dashboard/notifications",
            icon: <Bell size={18} />,
        },
        {
            name: "Transfers",
            href: "/dashboard/transfers",
            icon: <ArrowLeftRight size={18} />,
        },
        {
            name: "Friends & Social",
            href: "/dashboard/friends",
            icon: <Users size={18} />,
        },
        {
            name: "Currencies",
            href: "/dashboard/currencies",
            icon: <Coins size={18} />,
        },
        {
            name: "Crypto Terminal",
            href: "/dashboard/crypto",
            icon: <Bitcoin size={18} />,
        },
        {
            name: "Stocks & Trading",
            href: "/dashboard/stocks",
            icon: <TrendingUp size={18} />,
        },
        {
            name: "Cards Vault",
            href: "/dashboard/cards",
            icon: <CreditCard size={18} />,
        },
        {
            name: "Loans & Capital",
            href: "/dashboard/loans",
            icon: <Banknote size={18} />,
        },
        {
            name: "Premium Offers",
            href: "/dashboard/offers",
            icon: <Sparkles size={18} />,
        },
        {
            name: "Analytics",
            href: "/dashboard/analytics",
            icon: <BarChart3 size={18} />,
        },
        {
            name: "Settings & Security",
            href: "/dashboard/settings",
            icon: <Settings size={18} />,
        },
    ];

    const adminNavItems = [
        // --- CORE OPERATIONS ---
        {
            name: "Admin Control",
            href: "/dashboard",
            icon: <ShieldAlert size={18} />,
        },
        {
            name: "User Management",
            href: "/dashboard/admin/users",
            icon: <Users size={18} />,
        },

        // --- FINANCIAL ENGINES ---
        {
            name: "Transactions",
            href: "/dashboard/admin/transactions",
            icon: <ArrowLeftRight size={18} />,
        },
        {
            name: "Rates & Fee Engine",
            href: "/dashboard/admin/rates",
            icon: <Percent size={18} />,
        },
        {
            name: "Card Issuing",
            href: "/dashboard/admin/cards",
            icon: <CreditCard size={18} />,
        },

        // --- MARKETS & LIQUIDITY ---
        {
            name: "Crypto Pools",
            href: "/dashboard/admin/liquidity",
            icon: <Coins size={18} />,
        },
        {
            name: "Stock & Markets",
            href: "/dashboard/admin/stocks",
            icon: <TrendingUp size={18} />,
        },

        // --- RISK & COMPLIANCE ---
        {
            name: "Risk Control",
            href: "/dashboard/admin/fraud-control",
            icon: <Fingerprint size={18} />,
        },
        {
            name: "Audit Logs",
            href: "/dashboard/admin/audit-logs",
            icon: <FileText size={18} />,
        },

        // --- GROWTH & BUSINESS ---
        {
            name: "Subscriptions",
            href: "/dashboard/admin/subscriptions",
            icon: <Gem size={18} />,
        },
        {
            name: "Referrals",
            href: "/dashboard/admin/marketing",
            icon: <Megaphone size={18} />,
        },
        {
            name: "Business Analytics",
            href: "/dashboard/admin/analytics",
            icon: <BarChart3 size={18} />,
        },

        // --- DEVOPS & CONFIG ---
        {
            name: "System Health",
            href: "/dashboard/admin/system-health",
            icon: <ActivityIcon size={18} />,
        },
        {
            name: "Flags & Config",
            href: "/dashboard/admin/config",
            icon: <Sliders size={18} />,
        },
    ];

    const navItems = user.role === "admin" ? adminNavItems : clientNavItems;

    const workspace = user.role === "admin" ? "Admin workspace" : "Your workspace";
    const profile = (
        <div className={styles.profile} title={`${user.name} · ID: ${user.clientCode}`}>
            <span className={styles.avatar} aria-hidden="true">{user.name.trim().charAt(0).toUpperCase() || "U"}</span>
            <div className={styles.profileText}>
                <p className={styles.userName}>{user.name}</p>
                <p className={styles.userId}>ID: {user.clientCode}</p>
            </div>
        </div>
    );
    const navigation = (mobile = false) => (
        <nav id={mobile ? "mobile-workspace-navigation" : "workspace-navigation"} className={styles.navigation} aria-label={workspace}>
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    aria-label={item.name}
                    title={!mobile && isCollapsed ? item.name : undefined}
                    onClick={mobile ? () => setIsMobileOpen(false) : undefined}
                    className={styles.navItem}
                >
                    <span className={styles.icon} aria-hidden="true">{item.icon}</span>
                    <span className={styles.label}>{item.name}</span>
                </Link>
            ))}
        </nav>
    );
    const brand = (
        <Link href="/dashboard" className={styles.brand} aria-label="MBANK home" onClick={() => setIsMobileOpen(false)}>
            <span className={styles.brandIcon}><Landmark size={21} aria-hidden="true" /></span>
            <span className={styles.brandName}>MBANK</span>
        </Link>
    );

    return (
        <>
            <header className={styles.mobileBar}>
                <div className={styles.mobileIdentity}>
                    <span className={styles.mobileBrand}>MBANK</span>
                    <span className={styles.mobileUser} title={`${user.name} · ID: ${user.clientCode}`}>{user.name} · ID: {user.clientCode}</span>
                </div>
                <ActionButton variant="cyan" autoWidth compact className={styles.mobileToggle} aria-label="Open navigation" aria-expanded={isMobileOpen} aria-controls="mobile-sidebar" onClick={() => setIsMobileOpen(true)} icon={<Menu size={21} />} />
            </header>

            <dialog ref={mobileDialog} id="mobile-sidebar" className={styles.mobileDialog} aria-label={`${workspace} navigation`} onCancel={() => setIsMobileOpen(false)} onClose={() => setIsMobileOpen(false)}>
                <div className={styles.mobileDialogHeader}>
                    {brand}
                    <ActionButton variant="cyan" autoWidth compact className={styles.mobileToggle} aria-label="Close navigation" onClick={() => setIsMobileOpen(false)} icon={<X size={21} />} />
                </div>
                {profile}
                <p className={styles.sectionLabel}>{workspace}</p>
                {navigation(true)}
                <footer className={styles.footer}>
                    <button type="button" className={`${styles.navItem} ${styles.logout}`} onClick={() => { setIsMobileOpen(false); logout(); }}>
                        <span className={styles.icon}><LogOut size={18} aria-hidden="true" /></span><span className={styles.label}>Secure Exit</span>
                    </button>
                </footer>
            </dialog>

            <aside className={styles.sidebar} data-collapsed={isCollapsed} aria-label={`${workspace} sidebar`}>
                <div className={styles.desktopHeader}>
                    <div className={styles.brandRow}>
                        {brand}
                        <ActionButton variant="cyan" autoWidth compact className={styles.collapseToggle} onClick={() => setIsCollapsed(value => !value)} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!isCollapsed} aria-controls="workspace-navigation" title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} icon={isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />} />
                    </div>
                    {profile}
                    <p className={styles.sectionLabel} title={workspace}><span>{workspace}</span></p>
                </div>
                {navigation()}
                <footer className={styles.footer}>
                    <button type="button" onClick={logout} className={`${styles.navItem} ${styles.logout}`} aria-label="Secure Exit" title={isCollapsed ? "Secure Exit" : undefined}>
                        <span className={styles.icon}><LogOut size={18} aria-hidden="true" /></span><span className={styles.label}>Secure Exit</span>
                    </button>
                </footer>
            </aside>
        </>
    );
}
