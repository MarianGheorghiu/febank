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

export const mockFeeRules: FeeRule[] = [
    {
        id: "RULE-EUR-CC-01",
        name: "Retail Visa/MC Card Pay-In",
        category: "PAY_IN",
        channel: "Stripe Merchant Engine",
        currency: "EUR",
        baseFixedFee: 0.25,
        basePercentageFee: 1.4,
        fxSpreadMarkup: 0.5,
        minFeeCap: 0.5,
        maxFeeCap: 150.0,
        monthlyFreeAllowance: 500,
        volumeBrackets: [
            { upToVolume: 10000, percentageFee: 1.4, fixedFee: 0.25 },
            { upToVolume: 50000, percentageFee: 1.15, fixedFee: 0.2 },
            { upToVolume: "unlimited", percentageFee: 0.9, fixedFee: 0.15 },
        ],
        status: "ACTIVE",
        maker: "alex.marinescu@core.io",
        checker: "vlad.stancu@compliance.io",
        lastModified: "2026-06-24 14:20",
    },
    {
        id: "RULE-SEPA-OUT-02",
        name: "SEPA Instant Outbound Rail",
        category: "PAY_OUT",
        channel: "Clearbank Core API",
        currency: "EUR",
        baseFixedFee: 0.5,
        basePercentageFee: 0.0,
        fxSpreadMarkup: 0.0,
        minFeeCap: 0.5,
        maxFeeCap: 0.5,
        monthlyFreeAllowance: 0,
        volumeBrackets: [],
        status: "ACTIVE",
        maker: "elena.radu@liquidity.io",
        checker: "system.automated",
        lastModified: "2026-06-23 09:15",
    },
    {
        id: "RULE-FX-USDEUR-03",
        name: "USD/EUR Auto-Swap Premium",
        category: "FX_SWAP",
        channel: "LMAX Liquidity Bridge",
        currency: "USD",
        baseFixedFee: 0.0,
        basePercentageFee: 0.2,
        fxSpreadMarkup: 0.35,
        minFeeCap: 0.0,
        maxFeeCap: 500.0,
        monthlyFreeAllowance: 2000,
        volumeBrackets: [
            { upToVolume: 50000, percentageFee: 0.2, fixedFee: 0.0 },
            { upToVolume: "unlimited", percentageFee: 0.1, fixedFee: 0.0 },
        ],
        status: "PENDING_APPROVAL",
        maker: "andrei.g@trading.io",
        checker: null, // Necesită aprobare duală (4-eyes) pentru a intra în producție
        lastModified: "2026-06-24 18:45",
    },
    {
        id: "RULE-BTC-RETAIL-04",
        name: "Crypto Buying Desk - BTC Retail",
        category: "CRYPTO_TRADE",
        channel: "Coinbase Prime Institutional",
        currency: "EUR",
        baseFixedFee: 1.0,
        basePercentageFee: 1.95,
        fxSpreadMarkup: 0.75,
        minFeeCap: 1.5,
        maxFeeCap: 2500.0,
        monthlyFreeAllowance: 100,
        volumeBrackets: [
            { upToVolume: 5000, percentageFee: 1.95, fixedFee: 1.0 },
            { upToVolume: 25000, percentageFee: 1.5, fixedFee: 0.5 },
            { upToVolume: "unlimited", percentageFee: 1.2, fixedFee: 0.0 },
        ],
        status: "PAUSED",
        maker: "alex.marinescu@core.io",
        checker: "vlad.stancu@compliance.io",
        lastModified: "2026-05-12 11:00",
    },
];

// Sectiunea 2: Structuri pentru Cursuri si Spread-uri
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

// Sectiunea 3: Structura pentru Matricea de Planuri (Subscription Tiers)
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

// DATE MOCK REALE PENTRU INJECTARE ÎN INTERFAȚĂ
export const mockFxPairs: LiveFxPair[] = [
    {
        pair: "EUR/RON",
        baseRate: 4.9722,
        markupPercentage: 0.5,
        clientRate: 4.997,
        sourceNode: "Bnr Automated API",
        volatility: "STABLE",
    },
    {
        pair: "USD/EUR",
        baseRate: 0.9314,
        markupPercentage: 0.4,
        clientRate: 0.9351,
        sourceNode: "Reuters Feed Alpha",
        volatility: "LOW",
    },
    {
        pair: "GBP/EUR",
        baseRate: 1.184,
        markupPercentage: 0.6,
        clientRate: 1.1911,
        sourceNode: "Barclays Liquidity",
        volatility: "STABLE",
    },
    {
        pair: "BTC/USD",
        baseRate: 64250.0,
        markupPercentage: 1.2,
        clientRate: 65021.0,
        sourceNode: "Binance Orderbook Node",
        volatility: "HIGH",
    },
];

export const mockWeekendShield: WeekendShieldConfig = {
    isProtocolActive: true,
    additionalWeekendMarkup: 1.0,
    autoTriggerNode: "NYSE / LSE Market Closure Trigger",
};

export const mockSubscriptionMatrix: SubscriptionMatrixRow[] = [
    {
        actionId: "ACT-01",
        actionLabel: "Card Top-Up (Deposit)",
        standard: { feeDisplay: "1.50%", isCustomOverridden: false },
        premium: { feeDisplay: "0.80%", isCustomOverridden: false },
        metal: { feeDisplay: "FREE", isCustomOverridden: true },
    },
    {
        actionId: "ACT-02",
        actionLabel: "ATM Cash Withdrawal",
        standard: { feeDisplay: "2.00% (min 2€)", isCustomOverridden: false },
        premium: { feeDisplay: "First 500€ Free", isCustomOverridden: true },
        metal: { feeDisplay: "First 1000€ Free", isCustomOverridden: true },
    },
    {
        actionId: "ACT-03",
        actionLabel: "Crypto Asset Purchase",
        standard: { feeDisplay: "1.95% + 1€", isCustomOverridden: false },
        premium: { feeDisplay: "1.40%", isCustomOverridden: false },
        metal: { feeDisplay: "0.90% (Flat)", isCustomOverridden: true },
    },
    {
        actionId: "ACT-04",
        actionLabel: "International Wire (SWIFT)",
        standard: { feeDisplay: "15.00 EUR Fixed", isCustomOverridden: false },
        premium: { feeDisplay: "10.00 EUR Fixed", isCustomOverridden: false },
        metal: { feeDisplay: "FREE (1/mo)", isCustomOverridden: true },
    },
];
