export type Severity = "INFO" | "WARNING" | "CRITICAL";

export const SYSTEM_LOGS = [
    {
        id: "L1",
        time: "15:12:04",
        severity: "CRITICAL" as Severity,
        type: "AUTH_BRUTE_FORCE",
        target: "IP: 192.168.1.42",
    },
    {
        id: "L2",
        time: "15:08:22",
        severity: "INFO" as Severity,
        type: "LEDGER_SYNC",
        target: "System Cron",
    },
    {
        id: "L3",
        time: "14:59:10",
        severity: "WARNING" as Severity,
        type: "KYC_REJECTED",
        target: "USR-#8841",
    },
    {
        id: "L4",
        time: "14:45:00",
        severity: "INFO" as Severity,
        type: "NODE_SCALED",
        target: "Cluster-A",
    },
    {
        id: "L5",
        time: "14:32:11",
        severity: "CRITICAL" as Severity,
        type: "DB_LATENCY_SPIKE",
        target: "Core-DB-Primary",
    },
];

export const API_TRAFFIC_DATA = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    success: Math.floor(Math.random() * 5000) + 10000,
    errors: Math.floor(Math.random() * 200) + 10,
}));

export const FLAGGED_ENTITIES = [
    {
        id: "TXN-#992A",
        type: "TRANSACTION",
        risk: "CRITICAL",
        reason: "Velocity Limit Exceeded",
        amount: 14500.0,
        status: "FROZEN",
        history: [
            { date: "10 Iun", volume: 1200, riskScore: 10 },
            { date: "11 Iun", volume: 1500, riskScore: 15 },
            { date: "12 Iun", volume: 14500, riskScore: 98 },
            { date: "13 Iun", volume: 0, riskScore: 98 },
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
            { date: "10 Iun", volume: 50, riskScore: 20 },
            { date: "11 Iun", volume: 300, riskScore: 45 },
            { date: "12 Iun", volume: 2100, riskScore: 85 },
            { date: "13 Iun", volume: 400, riskScore: 80 },
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
            { date: "10 Iun", volume: 100, riskScore: 5 },
            { date: "11 Iun", volume: 150, riskScore: 10 },
            { date: "12 Iun", volume: 200, riskScore: 12 },
            { date: "13 Iun", volume: 2100, riskScore: 65 },
        ],
    },
];
