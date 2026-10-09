"use client";
import { createMockId } from "@/app/lib/mock/ids";
import { MOCK_PAGE_DATES } from "@/app/lib/mock/page-dates";

import React, { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { captureAdminAudit } from "@/app/components/ui/admin/audit/capture";
import PageHeader from "@/app/components/ui/PageHeader";
import { Download, ShieldCheck } from "lucide-react";
import { initialUsers, initialLogs, initialSessions } from "@/app/lib/mock/admin/users";
import type { User, AuditLog, UserSession } from "@/app/lib/types/admin/users";
import UsersTable from "@/app/components/ui/admin/users/UsersTable";
import UserActionModal from "@/app/components/ui/admin/users/UserActionModal";
import AuditLogsTable from "@/app/components/ui/admin/users/AuditLogsTable";
import SecuritySessionManager from "@/app/components/ui/admin/users/SecuritySessionManager";

export default function AdminUserManagementPage() {
    const { user: operator } = useUser();
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
    const [sessions, setSessions] = useState<UserSession[]>(initialSessions);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeUser, setActiveUser] = useState<User | null>(null);
    const [modalMode, setModalMode] = useState<
        "view" | "edit" | "block" | null
    >(null);

    const persistUserLog = (log: AuditLog, action: string) => captureAdminAudit({
        source: "USERS", category: action === "USER_EXPORT_REQUESTED" ? "DATA_ACCESS" : "SECURITY",
        action, target: log.targetUserId,
        severity: ["SESSIONS_REVOKED", "MFA_RESET", "USER_STATUS_CHANGED"].includes(action) ? "CRITICAL" : "WARNING",
        reason: `Administrator confirmed ${action.toLowerCase().replaceAll("_", " ")} in demo user management.`,
        before: log.before, after: log.after,
    }, operator);

    // Stări unificate pentru panoul din dreapta (Utilizator activ + Log activ inspectat)
    const [selectedSecurityUser, setSelectedSecurityUser] =
        useState<User | null>(initialUsers[0] || null);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const generateTxId = () =>
        createMockId("TX");

    // MODIFICAT LOGIC: Când se dă click pe un log din tabelă
    const handleSelectLog = (log: AuditLog) => {
        setSelectedLog(log);
        const matchingUser = users.find((u) => u.id === log.targetUserId);
        if (matchingUser) {
            setSelectedSecurityUser(matchingUser);
        }
    };

    const handleOpenActionModal = (
        user: User,
        mode: "view" | "edit" | "block",
    ) => {
        setActiveUser(user);
        setSelectedSecurityUser(user);
        setSelectedLog(null); // Resetează logul dacă se investighează direct din tabelul de utilizatori
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setActiveUser(null);
        setModalMode(null);
    };

    const handleRevokeAllSessions = (userId: string) => {
        const newLog: AuditLog = {
            id: generateTxId(),
            timestamp: new Date()
                .toISOString()
                .replace("T", " ")
                .substring(0, 23),
            actor: operator?.email ?? "unknown administrator",
            ip: "127.0.0.1",
            action: "HARD_ACCESS_FREEZE",
            targetUserId: userId,
            before: { active_sessions: "LIST_IDENTIFIED" },
            after: { active_sessions: "REVOKED_ALL", tokens_invalidated: true },
        };
        if (!persistUserLog(newLog, "SESSIONS_REVOKED")) return;
        setSessions((prev) => prev.filter((s) => s.userId !== userId));
        setLogs((prev) => [newLog, ...prev]);
        setSelectedLog(newLog); // Selectează automat noul log generat
    };

    const handleResetMFA = (userId: string) => {
        const newLog: AuditLog = {
            id: generateTxId(),
            timestamp: new Date()
                .toISOString()
                .replace("T", " ")
                .substring(0, 23),
            actor: operator?.email ?? "unknown administrator",
            ip: "127.0.0.1",
            action: "MUTATION_OVERRIDE",
            targetUserId: userId,
            before: { mfa_status: "ENABLED_TOTP" },
            after: { mfa_status: "DISABLED_HARD_RESET_REQUIRED" },
        };
        if (!persistUserLog(newLog, "MFA_RESET")) return;
        setLogs((prev) => [newLog, ...prev]);
        setSelectedLog(newLog);
    };

    const handleForcePasswordReset = (userId: string) => {
        const newLog: AuditLog = {
            id: generateTxId(),
            timestamp: new Date()
                .toISOString()
                .replace("T", " ")
                .substring(0, 23),
            actor: operator?.email ?? "unknown administrator",
            ip: "127.0.0.1",
            action: "MUTATION_OVERRIDE",
            targetUserId: userId,
            before: { password_policy: "STANDARD" },
            after: { password_policy: "FORCE_RESET_ON_NEXT_LOGIN" },
        };
        if (!persistUserLog(newLog, "PASSWORD_RESET_REQUESTED")) return;
        setLogs((prev) => [newLog, ...prev]);
        setSelectedLog(newLog);
    };

    const handleExportSingleUser = (user: User) => {
        const newLog: AuditLog = {
            id: generateTxId(),
            timestamp: new Date()
                .toISOString()
                .replace("T", " ")
                .substring(0, 23),
            actor: operator?.email ?? "unknown administrator",
            ip: "127.0.0.1",
            action: "BINARY_DUMP",
            targetUserId: user.id,
            before: null,
            after: { export_type: "SINGLE_NODE_DATABASE_DUMP" },
        };
        if (!persistUserLog(newLog, "USER_EXPORT_REQUESTED")) return;
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(user, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute(
            "download",
            `CRYPTO_DUMP_NODE_${user.id}.json`,
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();


        setLogs((prev) => [newLog, ...prev]);
        setSelectedLog(newLog);
    };

    const handleConfirmEdit = (updatedFields: Partial<User>) => {
        if (!activeUser) return;
        const beforeState: Record<string, unknown> = {};
        (Object.keys(updatedFields) as (keyof User)[]).forEach((key) => {
            beforeState[key] = activeUser[key];
        });

        const newLog: AuditLog = {
            id: generateTxId(),
            timestamp: new Date()
                .toISOString()
                .replace("T", " ")
                .substring(0, 23),
            actor: operator?.email ?? "unknown administrator",
            ip: "127.0.0.1",
            action: "MUTATION_OVERRIDE",
            targetUserId: activeUser.id,
            before: beforeState,
            after: updatedFields,
        };
        if (!persistUserLog(newLog, "USER_UPDATED")) return;

        setUsers((prev) =>
            prev.map((u) =>
                u.id === activeUser.id ? { ...u, ...updatedFields } : u,
            ),
        );
        setLogs((prev) => [newLog, ...prev]);
        setSelectedLog(newLog);
    };

    const handleConfirmBlockToggle = () => {
        if (!activeUser) return;
        const nextStatus =
            activeUser.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";

        const newLog: AuditLog = {
            id: generateTxId(),
            timestamp: new Date()
                .toISOString()
                .replace("T", " ")
                .substring(0, 23),
            actor: operator?.email ?? "unknown administrator",
            ip: "127.0.0.1",
            action:
                nextStatus === "BLOCKED"
                    ? "HARD_ACCESS_FREEZE"
                    : "SYSTEM_REINSTATE",
            targetUserId: activeUser.id,
            before: { status: activeUser.status },
            after: { status: nextStatus },
        };
        if (!persistUserLog(newLog, "USER_STATUS_CHANGED")) return;

        setUsers((prev) =>
            prev.map((u) =>
                u.id === activeUser.id ? { ...u, status: nextStatus } : u,
            ),
        );
        setLogs((prev) => [newLog, ...prev]);
        setSelectedLog(newLog);
    };

    const handleExportAllUsers = () => {
        if (!captureAdminAudit({ source: "USERS", category: "DATA_ACCESS", action: "USER_REGISTRY_EXPORT_REQUESTED", target: "user-registry", severity: "WARNING", reason: "Administrator requested the demo user registry export.", before: null, after: { records: users.length, format: "JSON" } }, operator)) return;
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(users, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute(
            "download",
            `GLOBAL_USER_REGISTRY_DATABASE.json`,
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    if (!operator || operator.role !== "admin") return <p className="p-6 text-rose-300">Administrator access required.</p>;

    return (
        <div className="w-full min-h-screen flex flex-col bg-[#02050e] text-white antialiased font-mono m-0 p-0 overflow-x-hidden relative">
            <div className="w-full shrink-0 border-b border-cyan-500/10 bg-[#02050e] m-0 p-0 overflow-hidden">
                <PageHeader
                    systemDate={MOCK_PAGE_DATES.admin_users}
                    statusText="SECURE_ROOT_LIVE"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full mt-2 sm:mt-0 p-0">
                        <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                                Context Security:
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1">
                                <ShieldCheck
                                    size={14}
                                    className="text-cyan-500"
                                />
                                USER_ADMIN_GRID
                            </span>
                        </div>

                        <div className="w-full sm:w-auto flex justify-start sm:justify-end shrink-0">
                            <button
                                onClick={handleExportAllUsers}
                                className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold tracking-tight transition-all active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                            >
                                <Download size={13} className="stroke-[2.5]" />
                                <span>Download Data</span>
                            </button>
                        </div>
                    </div>
                </PageHeader>
            </div>

            <div className="w-full flex flex-col m-0 p-0 gap-4 flex-grow">
                <div className="w-full">
                    <UsersTable
                        users={users}
                        onActionClick={handleOpenActionModal}
                        onExportUser={handleExportSingleUser}
                    />
                </div>

                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="w-full">
                        <AuditLogsTable
                            logs={logs}
                            selectedLogId={selectedLog ? selectedLog.id : null}
                            onSelectLog={handleSelectLog}
                        />
                    </div>

                    <div className="w-full">
                        <SecuritySessionManager
                            selectedUser={selectedSecurityUser}
                            selectedLog={selectedLog}
                            sessions={sessions}
                            onRevokeAllSessions={handleRevokeAllSessions}
                            onResetMFA={handleResetMFA}
                            onForcePasswordReset={handleForcePasswordReset}
                        />
                    </div>
                </div>
            </div>

            <UserActionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                user={activeUser}
                mode={modalMode}
                onConfirmEdit={handleConfirmEdit}
                onConfirmBlock={handleConfirmBlockToggle}
            />
        </div>
    );
}
