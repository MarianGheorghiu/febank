export type Severity = "INFO" | "WARNING" | "CRITICAL";

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface LogItem {
    id: string;
    time: string;
    severity: Severity;
    type: string;
    target: string;
}

export interface TrafficPoint {
    time: string;
    success: number;
    errors: number;
}

export interface HistoryPoint {
    date: string;
    volume: number;
    riskScore: number;
}

export interface FlaggedEntity {
    id: string;
    type: string;
    risk: RiskLevel;
    reason: string;
    amount: number;
    status: string;
    history: HistoryPoint[];
}
