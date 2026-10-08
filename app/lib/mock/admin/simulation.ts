import type { SimulationResult } from "@/app/lib/types/admin/simulation";

export const MOCK_SIMULATION_FX_SPREAD_PERCENT = 0.4;

export function simulateMockFees(amount: number, currency: string, tier: "STANDARD" | "PREMIUM" | "METAL", dayType: "WEEKDAY" | "WEEKEND", actionType: string): SimulationResult {
        // Algoritm de simulare determinist bazat pe regulile financiare
        const isWeekend = dayType === "WEEKEND";
        const isMetal = tier === "METAL";
        const isPremium = tier === "PREMIUM";

        const matchedRuleId = `RULE-${currency}-${actionType}-SIM`;
        const allowanceExceeded =
            amount > (isMetal ? 2000 : isPremium ? 500 : 100);

        // Calcule matematice ipotetice bazate pe regulile fintech setate anterior
        let pct =
            actionType === "CRYPTO_BUY"
                ? 1.95
                : actionType === "FX_SWAP"
                  ? 0.5
                  : 1.4;
        if (isMetal) pct -= 0.5;
        if (isPremium) pct -= 0.2;

        const variableFee = allowanceExceeded ? amount * (pct / 100) : 0;
        let fixedFee = actionType === "CRYPTO_BUY" ? 1.0 : 0.25;
        if (isMetal) fixedFee = 0;

        const fxSpreadFee =
            actionType === "FX_SWAP" || actionType === "CRYPTO_BUY"
                ? amount * (MOCK_SIMULATION_FX_SPREAD_PERCENT / 100)
                : 0;
        const weekendSurcharge = isWeekend ? amount * 0.01 : 0; // +1% Weekend Shield

        const rawTotal = variableFee + fixedFee + fxSpreadFee + weekendSurcharge;

        // Verificare Caps & Floors de siguranță
        let enforcedCap: SimulationResult["enforcedCap"] = "NONE";
        let finalFeeCollected = rawTotal;
        const floorLimit = 0.5;
        const ceilingLimit = 250.0;

        if (finalFeeCollected < floorLimit && finalFeeCollected > 0) {
            finalFeeCollected = floorLimit;
            enforcedCap = "FLOOR_LIMIT_APPLIED";
        } else if (finalFeeCollected > ceilingLimit) {
            finalFeeCollected = ceilingLimit;
            enforcedCap = "CEILING_LIMIT_APPLIED";
        }

        const logs = [
            `[INIT] Se procesează payload-ul de simulare pentru suma de ${amount} ${currency}`,
            `[MATCH] Identificat cluster regulă: ${matchedRuleId} bazat pe tipul acțiunii.`,
            `[ALLOWANCE] Verificare gratuități plan ${tier}: ${allowanceExceeded ? "Limita lunară a fost depășită. Se aplică taxe brute." : "În limitele planului gratuit."}`,
            isWeekend
                ? `[SECURITY] Scutul de Weekend DETECTAT (+1.00% suplimentar adăugat).`
                : `[SECURITY] Zi de tranzacționare standard. Piețele valutare sunt deschise.`,
            enforcedCap !== "NONE"
                ? `[CAP ENFORCEMENT] Alertă de siguranță activată: ${enforcedCap}. Valoarea brută de ${rawTotal.toFixed(2)} a fost ajustată.`
                : `[CAP CHECK] Valorile de calcul se încadrează în limitele de siguranță înregistrate.`,
        ];

        return {
            baseAmount: amount,
            currency,
            matchedRuleId,
            allowanceExceeded,
            isWeekendShieldTriggered: isWeekend,
            breakdown: {
                variableFee,
                fixedFee,
                fxSpreadFee,
                weekendSurcharge,
                rawTotal,
            },
            enforcedCap,
            finalFeeCollected,
            auditLogs: logs,
        };
}
