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
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
}
