import { ShieldAlert, Users, Server, Activity } from "lucide-react";
import GlassCard from "@/app/components/ui/GlassCard";

export default function AdminDashboard({ name }: { name: string }) {
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
              Total Active Users
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
              System Node Status
            </span>
            <Server size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-emerald-400 tracking-tight">
              99.98%
            </h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              All 4 gateway nodes online
            </p>
          </div>
        </GlassCard>

        <GlassCard className="!p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Flagged Transactions
            </span>
            <Activity size={18} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-amber-400 tracking-tight">
              3 Pending
            </h3>
            <p className="text-[11px] text-amber-500/80 font-bold mt-1">
              Requires manual AML approval
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
