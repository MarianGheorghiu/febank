export interface SimulationResult {
    baseAmount: number;
    currency: string;
    matchedRuleId: string;
    allowanceExceeded: boolean;
    isWeekendShieldTriggered: boolean;
    breakdown: {
        variableFee: number;
        fixedFee: number;
        fxSpreadFee: number;
        weekendSurcharge: number;
        rawTotal: number;
    };
    enforcedCap: "NONE" | "FLOOR_LIMIT_APPLIED" | "CEILING_LIMIT_APPLIED";
    finalFeeCollected: number;
    auditLogs: string[];
}
