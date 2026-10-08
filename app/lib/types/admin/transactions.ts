export interface Transaction {
    id: string;
    timestamp: string;
    sender: string;
    receiver: string;
    type: "FIAT" | "CRYPTO" | "STOCKS" | "SYSTEM";
    subType: string;
    amount: number;
    currency: string;
    feeCollected: number;
    status: "COMPLETED" | "PENDING" | "FAILED" | "CANCELLED" | "FLAGGED";
    riskScore: "LOW" | "MEDIUM" | "HIGH";
    networkIp?: string;
    payloadHash?: string;
}
