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

export const SYSTEM_LOGS: LogItem[] = [
    {
        id: "L1",
        time: "15:12:04",
        severity: "CRITICAL",
        type: "AUTH_BRUTE_FORCE",
        target: "IP: 192.168.1.42",
    },
    {
        id: "L2",
        time: "15:08:22",
        severity: "INFO",
        type: "LEDGER_SYNC",
        target: "System Cron",
    },
    {
        id: "L3",
        time: "14:59:10",
        severity: "WARNING",
        type: "KYC_REJECTED",
        target: "USR-#8841",
    },
    {
        id: "L4",
        time: "14:45:00",
        severity: "INFO",
        type: "NODE_SCALED",
        target: "Cluster-A",
    },
    {
        id: "L5",
        time: "14:32:11",
        severity: "CRITICAL",
        type: "DB_LATENCY_SPIKE",
        target: "Core-DB-Primary",
    },
];

export const API_TRAFFIC_DATA: TrafficPoint[] = Array.from({ length: 24 }).map(
    (_, i) => ({
        time: `${String(i).padStart(2, "0")}:00`,
        success: Math.floor(Math.random() * 5000) + 10000,
        errors: Math.floor(Math.random() * 200) + 10,
    }),
);

export const FLAGGED_ENTITIES: FlaggedEntity[] = [
    {
        id: "TXN-#992A",
        type: "TRANSACTION",
        risk: "CRITICAL",
        reason: "Velocity Limit Exceeded",
        amount: 14500.0,
        status: "FROZEN",
        history: [
            { date: "10 IUN", volume: 1200, riskScore: 15 },
            { date: "11 IUN", volume: 1500, riskScore: 30 },
            { date: "12 IUN", volume: 14500, riskScore: 98 },
            { date: "13 IUN", volume: 200, riskScore: 95 },
        ],
    },
    {
        id: "USR-#4112",
        type: "ACCOUNT",
        risk: "HIGH",
        reason: "Multiple IP Logins",
        amount: 0,
        status: "RESTRICTED",
        history: [
            { date: "10 IUN", volume: 50, riskScore: 20 },
            { date: "11 IUN", volume: 300, riskScore: 45 },
            { date: "12 IUN", volume: 2100, riskScore: 85 },
            { date: "13 IUN", volume: 400, riskScore: 80 },
        ],
    },
    {
        id: "TXN-#992B",
        type: "TRANSACTION",
        risk: "MEDIUM",
        reason: "Unusual Geo-Location",
        amount: 2100.5,
        status: "PENDING",
        history: [
            { date: "10 IUN", volume: 100, riskScore: 5 },
            { date: "11 IUN", volume: 150, riskScore: 12 },
            { date: "12 IUN", volume: 200, riskScore: 25 },
            { date: "13 IUN", volume: 2100, riskScore: 65 },
        ],
    },
];
