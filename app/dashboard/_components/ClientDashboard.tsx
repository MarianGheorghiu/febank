import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp } from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";

export default function ClientDashboard({ name }: { name: string }) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Bun venit */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Welcome back, {name.split(" ")[0]}
        </h1>
        <p className="text-xs text-gray-400 tracking-wide mt-1">
          Premium Private Banking Terminal • Secure Session Active
        </p>
      </div>

      {/* Grid de Carduri Financiare Premium */}
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

      {/* Placeholder pentru restul paginii (Transfers, Chart etc.) */}
      <GlassCard className="h-64 flex items-center justify-center border-dashed border-white/10">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
          Market Analytics & Live Feed Section
        </p>
      </GlassCard>
    </div>
  );
}
