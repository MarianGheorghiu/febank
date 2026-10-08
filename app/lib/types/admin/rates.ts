export interface VolumeBracket {
    upToVolume: number | "unlimited";
    percentageFee: number;
    fixedFee: number;
}

export interface FeeRule {
    id: string;
    name: string;
    category: "PAY_IN" | "PAY_OUT" | "FX_SWAP" | "CRYPTO_TRADE" | "EQUITIES";
    channel: string; // Ex: "Stripe Acquiring", "Clearbank SEPA", "Binance Liquidity Provider"
    currency: string;

    // Core Engine Metrics
    baseFixedFee: number;
    basePercentageFee: number;
    fxSpreadMarkup: number; // Spread valutar adăugat în % (ex: 0.40% peste cursul interbancar)

    // Safety Bounds (Caps)
    minFeeCap: number; // Comision minim încasat (Floor)
    maxFeeCap: number; // Comision maxim garantat (Ceiling)

    // Allowances
    monthlyFreeAllowance: number; // Suma tranzacționată gratuit pe lună per user

    // Tiered Configuration
    volumeBrackets: VolumeBracket[];

    // Security & Compliance (4-Eyes Principle / Maker-Checker)
    status: "ACTIVE" | "PENDING_APPROVAL" | "PAUSED";
    maker: string; // Cine a propus regula / modificarea
    checker: string | null; // Cine a aprobat-o securizat (Multi-sig/Dual-control)
    lastModified: string;
}

export interface LiveFxPair {
    pair: string; // Ex: "EUR/RON"
    baseRate: number; // Cursul real de pe piață (Interbancar read-only)
    markupPercentage: number; // Marja platformei (% adăugat peste bază)
    clientRate: number; // Cursul final calculat afișat utilizatorului
    sourceNode: string; // Sursa API (Ex: ECB API, Bloomberg Node)
    volatility: "LOW" | "STABLE" | "HIGH";
}

export interface WeekendShieldConfig {
    isProtocolActive: boolean;
    additionalWeekendMarkup: number; // Ex: +1.00% peste spread-ul normal
    autoTriggerNode: string; // Ex: "Friday 22:00 UTC - Sunday 22:00 UTC"
}

export interface TierCell {
    feeDisplay: string; // Ce text vede adminul (ex: "1.50%" sau "Gratuit")
    isCustomOverridden: boolean;
}

export interface SubscriptionMatrixRow {
    actionId: string;
    actionLabel: string;
    standard: TierCell;
    premium: TierCell;
    metal: TierCell;
}
