// app/dashboard/layout.tsx
import { UserProvider } from "@/app/context/UserContext";
import SettingsProvider from "@/app/context/SettingsProvider";
import DashboardShell from "./DashboardShell";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <SettingsProvider><DashboardShell>{children}</DashboardShell></SettingsProvider>
        </UserProvider>
    );
}
