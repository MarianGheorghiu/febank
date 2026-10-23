"use client";
import { useUser } from "@/app/context/UserContext";

// Importul sub-panourilor extrase din folderul _components
import AdminDashboard from "./_components/AdminDashboard";
import ClientDashboard from "./_components/ClientDashboard";

export default function DashboardPage() {
    const { user, loading } = useUser();

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
        <ClientDashboard key={user.email} name={user.name} clientId={user.email} />
    );
}
