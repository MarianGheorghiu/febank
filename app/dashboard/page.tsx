"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Wallet,
  TrendingUp,
  ShieldAlert,
  Users,
  Server,
} from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";
import { showMbankToast } from "../lib/toast";
import { useRouter } from "next/navigation";

// 1. VIEW PENTRU CLIENT (Definit direct aici ca să evităm erori de import)
function ClientDashboard({ name }: { name: string }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Welcome back, {name.split(" ")[0]}
        </h1>
        <p className="text-xs text-gray-400 tracking-wide mt-1">
          Premium Private Banking Terminal • Secure Session Active
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="!p-6 space-y-4 border-l-2 border-cyan-500/50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Total Liquidity
            </span>
            <Wallet size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight">$142,350.80</h3>
            <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <ArrowUpRight size={12} /> +4.2% this month
            </p>
          </div>
        </GlassCard>

        <GlassCard className="!p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Crypto Portfolio
            </span>
            <TrendingUp size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight">2.405 BTC</h3>
            <p className="text-[11px] text-purple-400 font-mono tracking-wider mt-1">
              ~ $164,200.00 USD
            </p>
          </div>
        </GlassCard>

        <GlassCard className="!p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Active Investments
            </span>
            <ArrowUpRight size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight">$45,120.00</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              12 Stocks & 3 Indexes
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// 2. VIEW PENTRU ADMIN
function AdminDashboard({ name }: { name: string }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-red-400 flex items-center gap-3">
          <ShieldAlert size={28} /> Control Center
        </h1>
        <p className="text-xs text-gray-400 tracking-wide mt-1">
          System Root Access: {name} • Operations & Core Ledger
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="!p-6 space-y-4 border-l-2 border-red-500/50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Active Users
            </span>
            <Users size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight">1,240</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              14 waiting verification
            </p>
          </div>
        </GlassCard>

        <GlassCard className="!p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Node Status
            </span>
            <Server size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-emerald-400 tracking-tight">
              99.98%
            </h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              All nodes online
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// 3. EXPORTUL DEFAULT IMPUS DE NEXT.JS (Trebuie să fie funcție normală, NU async)
export default function DashboardPage() {
  const [user, setUser] = useState<{
    name: string;
    role: "client" | "admin";
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Simulam preluarea datelor userului
    setUser({
      name: "Alexandru Rădulescu",
      role: "client", // Schimbă în "admin" pentru a testa panoul de admin
    });
    // 1. După 2 secunde, simulăm o notificare de la un prieten
    const socialTimeout = setTimeout(() => {
      showMbankToast({
        category: "social",
        title: "Split Bill Received",
        description:
          "Matei Dan requested $24.50 USD for 'Private Dinner & Drinks'.",
        router: router,
      });
    }, 2000);

    // 2. După 5 secunde, simulăm o alertă de securitate urgentă de la bancă
    const bankTimeout = setTimeout(() => {
      showMbankToast({
        category: "institutional",
        title: "New Terminal Authorized",
        description:
          "A secure session was opened from an unrecognized IP in Frankfurt, DE.",
        isUrgent: true,
        router: router,
      });
    }, 5000);

    return () => {
      clearTimeout(socialTimeout);
      clearTimeout(bankTimeout);
    };
  }, [router]);

  if (!user) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <p className="text-sm font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
          Decrypting Security Profile...
        </p>
      </div>
    );
  }

  return user.role === "admin" ? (
    <AdminDashboard name={user.name} />
  ) : (
    <ClientDashboard name={user.name} />
  );
}
