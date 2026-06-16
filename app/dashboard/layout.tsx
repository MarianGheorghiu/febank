// app/dashboard/layout.tsx
import { UserProvider } from "@/app/context/UserContext";
import DashboardShell from "./DashboardShell";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <DashboardShell>{children}</DashboardShell>
        </UserProvider>
    );
}
