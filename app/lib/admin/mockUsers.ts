// app/lib/admin/mockUsers.ts

export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
    role: "ADMIN" | "OPERATOR" | "COMPLIANCE" | "CLIENT";
    status: "ACTIVE" | "BLOCKED";
    balance: number;
    clearanceLevel: number;
    lastActive: string;
}

export interface UserSession {
    id: string;
    userId: string;
    device: string;
    browser: string;
    ip: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
}

export const initialUsers: User[] = [
    {
        id: "USR-9021",
        name: "Alexandru Radu",
        username: "@radualex",
        email: "a.radu@matrixbank.internal",
        phone: "+40 722 111 222",
        role: "ADMIN",
        status: "ACTIVE",
        balance: 142050.0,
        clearanceLevel: 5,
        lastActive: "18 JUN 2026 14:22",
    },
    {
        id: "USR-4412",
        name: "Elena Vasilescu",
        username: "@elenav",
        email: "e.vasilescu@matrixbank.dev",
        phone: "+40 731 444 555",
        role: "OPERATOR",
        status: "ACTIVE",
        balance: 12500.45,
        clearanceLevel: 3,
        lastActive: "17 JUN 2026 13:05",
    },
    {
        id: "USR-0883",
        name: "Mihai Popescu",
        username: "@mpopescu",
        email: "m.popescu@external.node",
        phone: "+40 745 999 000",
        role: "CLIENT",
        status: "BLOCKED",
        balance: 0.0,
        clearanceLevel: 1,
        lastActive: "15 JUN 2026 09:15",
    },
    {
        id: "USR-7721",
        name: "Diana Popa",
        username: "@dianap",
        email: "d.popa@compliance.internal",
        phone: "+40 720 888 999",
        role: "COMPLIANCE",
        status: "ACTIVE",
        balance: 89400.1,
        clearanceLevel: 4,
        lastActive: "18 JUN 2026 15:10",
    },
];

export interface AuditLog {
    id: string;
    timestamp: string;
    actor: string;
    ip: string;
    action:
        | "MUTATION_OVERRIDE"
        | "HARD_ACCESS_FREEZE"
        | "SYSTEM_REINSTATE"
        | "BINARY_DUMP";
    targetUserId: string;
    before: Record<string, any> | null;
    after: Record<string, any> | null;
}

export const initialLogs: AuditLog[] = [
    {
        id: "TX-770205",
        timestamp: "18 JUN 2026 15:08:22.104",
        actor: "@dianap",
        ip: "192.168.42.105",
        action: "SYSTEM_REINSTATE",
        targetUserId: "USR-4412",
        before: { status: "SUSPENDED_TEMPORARY" },
        after: { status: "ACTIVE" },
    },
    {
        id: "TX-770201",
        timestamp: "18 JUN 2026 11:45:10.891",
        actor: "@radualex",
        ip: "10.240.0.4",
        action: "MUTATION_OVERRIDE",
        targetUserId: "USR-7721",
        before: { clearanceLevel: 4, balance: 85000.0 },
        after: { clearanceLevel: 5, balance: 89400.1 },
    },
    {
        id: "TX-770199",
        timestamp: "17 JUN 2026 09:12:33.002",
        actor: "@elenav",
        ip: "10.240.0.12",
        action: "MUTATION_OVERRIDE",
        targetUserId: "USR-0883",
        before: { balance: 150.0 },
        after: { balance: 0.0 },
    },
    {
        id: "TX-770192",
        timestamp: "16 JUN 2026 14:30:11.402",
        actor: "@radualex",
        ip: "10.240.0.4",
        action: "HARD_ACCESS_FREEZE",
        targetUserId: "USR-0883",
        before: { status: "ACTIVE" },
        after: { status: "BLOCKED" },
    },
    {
        id: "TX-770185",
        timestamp: "15 JUN 2026 14:22:05.119",
        actor: "@dianap",
        ip: "192.168.42.105",
        action: "MUTATION_OVERRIDE",
        targetUserId: "USR-4412",
        before: { role: "CLIENT", clearanceLevel: 1 },
        after: { role: "OPERATOR", clearanceLevel: 3 },
    },
    {
        id: "TX-770177",
        timestamp: "14 JUN 2026 18:01:44.225",
        actor: "@elenav",
        ip: "10.240.0.12",
        action: "SYSTEM_REINSTATE",
        targetUserId: "USR-4412",
        before: { status: "OFFLINE" },
        after: { status: "ACTIVE" },
    },
    {
        id: "TX-770160",
        timestamp: "13 JUN 2026 22:19:02.511",
        actor: "@dianap",
        ip: "192.168.42.110",
        action: "BINARY_DUMP",
        targetUserId: "USR-7721",
        before: null,
        after: { scope: "AUDIT_COMPLIANCE_EXPORT_Q2" },
    },
    {
        id: "TX-770154",
        timestamp: "12 JUN 2026 11:14:55.882",
        actor: "@radualex",
        ip: "10.240.0.4",
        action: "BINARY_DUMP",
        targetUserId: "USR-9021",
        before: null,
        after: { action: "EXPORT_FULL_DATABASE" },
    },
    {
        id: "TX-770142",
        timestamp: "11 JUN 2026 08:05:12.304",
        actor: "@elenav",
        ip: "10.240.0.12",
        action: "MUTATION_OVERRIDE",
        targetUserId: "USR-0883",
        before: { status: "PENDING" },
        after: { status: "ACTIVE" },
    },
];

export const initialSessions: UserSession[] = [
    {
        id: "SES-8812",
        userId: "USR-9021", // Alexandru Radu
        device: "MacBook Pro 16",
        browser: "Chrome 125.0",
        ip: "10.240.0.4",
        location: "București, RO",
        lastActive: "Acum (Activ)",
        isCurrent: true,
    },
    {
        id: "SES-8813",
        userId: "USR-9021",
        device: "iPhone 15 Pro",
        browser: "Safari Mobile",
        ip: "86.120.43.12",
        location: "București, RO",
        lastActive: "18 JUN 2026 14:15",
        isCurrent: false,
    },
    {
        id: "SES-4401",
        userId: "USR-4412", // Elena Vasilescu
        device: "ThinkPad X1 Carbon",
        browser: "Firefox 126.0",
        ip: "10.240.0.12",
        location: "Cluj-Napoca, RO",
        lastActive: "Acum (Activ)",
        isCurrent: true,
    },
    {
        id: "SES-0992",
        userId: "USR-0883", // Mihai Popescu (Cont compromis ipotetic)
        device: "Unknown Linux Node",
        browser: "HeadlessChrome",
        ip: "185.220.101.5",
        location: "Frankfurt, DE",
        lastActive: "15 JUN 2026 09:15",
        isCurrent: false,
    },
    {
        id: "SES-7711",
        userId: "USR-7721", // Diana Popa
        device: "iMac 27",
        browser: "Safari 17.4",
        ip: "192.168.42.105",
        location: "Iași, RO",
        lastActive: "Acum (Activ)",
        isCurrent: true,
    },
];
