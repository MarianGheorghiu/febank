"use client";
import { usePreferences } from "./PreferencesContext";
import { assertManagedAccess, ensureManagedUser, registerManagedSession, USERS_EVENT, USERS_KEY } from "@/app/lib/user-management/store";
import { getDemoSession } from "@/app/lib/session/demo";
import { clearDemoSession } from "@/app/lib/session/demo";
import { createMockSession, determineRole } from "@/app/lib/mock/auth";
import type { UserProps } from "@/app/lib/types/auth";
import { notifyOperation } from "@/app/components/ui/OperationNotification";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserContextType {
    user: UserProps | null;
    loading: boolean;
    login: (email: string, name: string) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    login: () => {},
    logout: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProps | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const read = () => {
            try {
                const raw = localStorage.getItem("mbank_session");
                const saved = raw ? JSON.parse(raw) : null;
                if (saved && typeof saved.email === "string" && saved.email.trim() && typeof saved.name === "string" && typeof saved.clientCode === "string") {
                    const managed = ensureManagedUser(saved.email, saved.name);
                    assertManagedAccess(saved.email, false);
                    const current = getDemoSession(saved.email);
                    const session = registerManagedSession(managed, current.id, current.started_at);
                    if (session.revoked_at || Date.parse(session.expires_at) <= Date.now()) throw new Error("Session revoked or expired.");
                    setUser({ name: managed.legal_name, email: managed.login_email, clientCode: saved.clientCode, role: determineRole(saved.email) });
                } else setUser(null);
            } catch { setUser(null); }
            setLoading(false);
        };
        const timer = window.setTimeout(read, 0);
        const changed = (event: StorageEvent) => { if (event.key === "mbank_session" || event.key === USERS_KEY || event.key === null) read(); };
        const usersChanged = () => { window.setTimeout(read, 0); };
        window.addEventListener("storage", changed); window.addEventListener(USERS_EVENT, usersChanged);
        return () => { window.clearTimeout(timer); window.removeEventListener("storage", changed); window.removeEventListener(USERS_EVENT, usersChanged); };
    }, []);

    const login = (email: string, name: string) => {
        const managed = ensureManagedUser(email, name);
        assertManagedAccess(email, false);
        setLoading(true);
        clearDemoSession(email);
        const sessionUser = createMockSession(managed.login_email, managed.legal_name);
        const current = getDemoSession(managed.login_email);
        try { registerManagedSession(managed, current.id, current.started_at); }
        catch (cause) { setLoading(false); throw cause; }

        localStorage.setItem("mbank_session", JSON.stringify(sessionUser));
        setUser(sessionUser);
        setLoading(false);

        router.push("/dashboard");
        notifyOperation(`Welcome, ${sessionUser.name}!`, "You're signed in to MBANK.", false, "MBANK");
    };

    const logout = () => {
        if (user) clearDemoSession(user.email);
        localStorage.removeItem("mbank_session");
        setUser(null);
        router.push("/auth/login");
    };

    return (
        <UserContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => { const value = useContext(UserContext); const { snapshot } = usePreferences(); return { ...value, user: value.user && snapshot?.identity.email.trim().toLowerCase() === value.user.email.trim().toLowerCase() ? { ...value.user, name: snapshot.display_name } : value.user }; };
