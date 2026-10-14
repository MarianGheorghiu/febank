// app/dashboard/DashboardShell.tsx
"use client";

import "./dashboard-layout.css";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidenav from "@/app/components/ui/Sidenav";
import { useUser } from "@/app/context/UserContext";

export default function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();
    const isMailbox = usePathname() === "/dashboard/notifications";

    useEffect(() => {
        // Redirecționare automată la login dacă sesiunea lipsește
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="h-screen w-screen bg-[#030712] flex items-center justify-center">
                <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                    Decrypting Security Profile...
                </p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div data-mail-layout={isMailbox ? "true" : undefined} className={`${isMailbox ? "h-dvh min-h-0 overflow-hidden" : "min-h-screen"} bg-[#030712] text-white flex flex-col md:flex-row`}>
            {/* Sidenav preia acum utilizatorul real configurat din Login */}
            <Sidenav user={user} />

            <main className={`flex-1 min-w-0 pt-16 md:pt-0 ${isMailbox ? "min-h-0 overflow-hidden" : ""}`}>
                <div data-dashboard-inset className={`w-full h-full flex flex-col p-4 md:p-6 ${isMailbox ? "min-h-0 overflow-hidden" : ""}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
