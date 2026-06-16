"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import { showMbankToast } from "@/app/lib/toast";

// Importul sub-panourilor extrase din folderul _components
import AdminDashboard from "./_components/AdminDashboard";
import ClientDashboard from "./_components/ClientDashboard";

export default function DashboardPage() {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;

        // Alerte simulate specifice doar pentru clienții retail
        if (user.role === "client") {
            const socialTimeout = setTimeout(() => {
                showMbankToast({
                    category: "social",
                    title: "Split Bill Received",
                    description:
                        "Matei Dan requested $24.50 USD for 'Private Dinner & Drinks'.",
                    router: router,
                });
            }, 2000);

            return () => clearTimeout(socialTimeout);
        }
    }, [router, user]);

    // Starea de încărcare în timp ce se validează contextul de securitate
    if (loading || !user) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                    Decrypting Security Profile...
                </p>
            </div>
        );
    }

    // Randare curată, 100% dinamică pe bază de rol
    return user.role === "admin" ? (
        <AdminDashboard name={user.name} />
    ) : (
        <ClientDashboard name={user.name} />
    );
}
