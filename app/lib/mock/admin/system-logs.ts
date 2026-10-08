export const MOCK_SYSTEM_LOGS = [
    {
        id: "1",
        time: "16:14:02",
        severity: "CRITICAL",
        type: "AUTH_BYPASS_ATTEMPT",
        target: "usr_mgr_v2 / IP: 185.220.101.5",
    },
    {
        id: "2",
        time: "16:12:45",
        severity: "WARNING",
        type: "DB_LATENCY_SPIKE",
        target: "cluster_eu_west / 450ms query delay",
    },
    {
        id: "3",
        time: "16:10:11",
        severity: "INFO",
        type: "SSL_RENEWAL_SUCCESS",
        target: "gateway.api.internal",
    },
    {
        id: "4",
        time: "16:08:59",
        severity: "CRITICAL",
        type: "RATE_LIMIT_EXCEEDED",
        target: "endpoint: /v1/auth/token",
    },
    {
        id: "5",
        time: "16:05:23",
        severity: "INFO",
        type: "CACHE_PURGE_COMMAND",
        target: "redis_node_04 / manual_trigger",
    },
    {
        id: "6",
        time: "16:01:12",
        severity: "WARNING",
        type: "DISK_SPACE_LOW",
        target: "node_storage_02 / 88% capacity",
    },
];
