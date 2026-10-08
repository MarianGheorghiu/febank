"use client";
import { createMockSession, determineRole } from "@/app/lib/mock/auth";
import type { UserProps } from "@/app/lib/types/auth";

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
        // Verificăm dacă există deja o sesiune activă la încărcarea paginii
        const savedSession = localStorage.getItem("mbank_session");

        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                setUser({
                    ...sessionData,
                    role: determineRole(sessionData.email), // Forțăm determinarea din email
                });
            } catch (e) {
                localStorage.removeItem("mbank_session");
            }
        }
        setLoading(false);
    }, []);

    const login = (email: string, name: string) => {
        setLoading(true);
        const sessionUser = createMockSession(email, name);

        localStorage.setItem("mbank_session", JSON.stringify(sessionUser));
        setUser(sessionUser);
        setLoading(false);

        router.push("/dashboard");
    };

    const logout = () => {
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

export const useUser = () => useContext(UserContext);
