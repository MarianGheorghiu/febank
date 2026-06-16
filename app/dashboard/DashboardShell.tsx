// app/dashboard/DashboardShell.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidenav from "@/app/components/ui/Sidenav";
import { useUser } from "@/app/context/UserContext";

export default function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();

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
        <div className="min-h-screen bg-[#030712] text-white flex flex-col md:flex-row">
            {/* Sidenav preia acum utilizatorul real configurat din Login */}
            <Sidenav user={user} />

            <main className="flex-1 min-w-0 pt-16 md:pt-0 transition-all duration-300">
                <div className="w-full h-full p-4 md:p-6 flex flex-col">
                    {children}
                </div>
            </main>
        </div>
    );
}
