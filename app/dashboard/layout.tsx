import Sidenav from "@/app/components/ui/Sidenav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mockUser = {
    name: "Marian G",
    clientCode: "MB-9021-X",
    role: "client" as const,
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col md:flex-row">
      <Sidenav user={mockUser} />

      <main className="flex-1 min-w-0 pt-16 md:pt-0 transition-all duration-300">
        <div className="w-full h-full p-4 md:p-6 flex flex-col">{children}</div>
      </main>
    </div>
  );
}
