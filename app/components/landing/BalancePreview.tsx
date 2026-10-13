"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import styles from "./landing.module.css";

const snapshots = {
    "1W": { balance: "24,680", change: "+2.4%", caption: "Past 7 days" },
    "1M": { balance: "28,450", change: "+8.2%", caption: "Past 30 days" },
    "1Y": { balance: "42,890", change: "+24.8%", caption: "Past year" },
};
type Period = keyof typeof snapshots;

export default function BalancePreview() {
    const [period, setPeriod] = useState<Period>("1M");
    const snapshot = snapshots[period];
    return (
        <div
            className={styles.balancePreview}
            aria-label="Interactive balance preview with example data"
        >
            <div className={styles.previewTop}>
                <span>
                    <TrendingUp size={18} /> Your money, moving forward
                </span>
                <span className={styles.previewDots} aria-hidden="true">
                    •••
                </span>
            </div>
            <div className={styles.previewAmount}>
                ${snapshot.balance}
                <span>.00</span>
            </div>
            <div className={styles.previewGrowth}>
                <span>{snapshot.change}</span>
                <span>{snapshot.caption}</span>
            </div>
            <div className={styles.previewBottom}>
                <span>Illustrative balance</span>
                <div role="group" aria-label="Preview period">
                    {(Object.keys(snapshots) as Period[]).map((value) => (
                        <button
                            key={value}
                            onClick={() => setPeriod(value)}
                            aria-pressed={period === value}
                        >
                            {value}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
