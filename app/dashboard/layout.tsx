import Sidenav from "@/app/components/ui/Sidenav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simulare date user (în mod normal le iei dintr-un JWT, Session cookie sau Global State)
  const mockUser = {
    name: "Alexandru Rădulescu",
    clientCode: "MB-9021-X",
    role: "client" as const, // sau "admin"
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col md:flex-row">
      {/* Sidenav hibrid desktop/mobil */}
      <Sidenav user={mockUser} />

      {/* Containerul principal de conținut */}
      {/* Pe mobil adăugăm pt-16 (padding-top) ca să nu treacă sub top bar-ul fix */}
      {/* Pe desktop adăugăm o clasă dinamică care lasă spațiu pentru sidebar */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0 md:pl-64 transition-all duration-300 page-container-dynamic">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
