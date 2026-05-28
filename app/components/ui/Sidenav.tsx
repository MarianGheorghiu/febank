"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Landmark,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Coins,
  Bitcoin,
  TrendingUp,
  CreditCard,
  Banknote,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  UserCheck,
  Bell,
} from "lucide-react";

interface UserProps {
  name: string;
  clientCode: string;
  role: "client" | "admin";
}

export default function Sidenav({ user }: { user: UserProps }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const lastLogin = "28 May 2026 - 18:39";

  const clientNavItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Message Center",
      href: "/dashboard/notifications",
      icon: <Bell size={18} />,
    },
    {
      name: "Transfers",
      href: "/dashboard/transfers",
      icon: <ArrowLeftRight size={18} />,
    },
    {
      name: "Friends & Social",
      href: "/dashboard/friends",
      icon: <Users size={18} />,
    },
    {
      name: "Currencies",
      href: "/dashboard/currencies",
      icon: <Coins size={18} />,
    },
    {
      name: "Crypto Terminal",
      href: "/dashboard/crypto",
      icon: <Bitcoin size={18} />,
    },
    {
      name: "Stocks & Trading",
      href: "/dashboard/stocks",
      icon: <TrendingUp size={18} />,
    },
    {
      name: "Cards Vault",
      href: "/dashboard/cards",
      icon: <CreditCard size={18} />,
    },
    {
      name: "Loans & Capital",
      href: "/dashboard/loans",
      icon: <Banknote size={18} />,
    },
    {
      name: "Premium Offers",
      href: "/dashboard/offers",
      icon: <Sparkles size={18} />,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 size={18} />,
    },
    {
      name: "Settings & Security",
      href: "/dashboard/settings",
      icon: <Settings size={18} />,
    },
  ];

  const adminNavItems = [
    {
      name: "Admin Control",
      href: "/dashboard/admin",
      icon: <ShieldAlert size={18} />,
    },
    {
      name: "User Management",
      href: "/dashboard/admin/users",
      icon: <UserCheck size={18} />,
    },
    {
      name: "System Settings",
      href: "/dashboard/admin/settings",
      icon: <Settings size={18} />,
    },
  ];

  const navItems = user.role === "admin" ? adminNavItems : clientNavItems;

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden w-full h-16 fixed top-0 left-0 bg-[#030712]/70 backdrop-blur-xl border-b border-white/[0.08] px-5 flex items-center justify-between z-50 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2 rounded-lg border border-cyan-500/30">
            <Landmark size={16} className="text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-[0.15em] text-white uppercase leading-none">
              MBANK
            </span>
            <span className="text-[9px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
              <Clock size={10} className="text-cyan-500" /> {lastLogin}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white active:bg-cyan-500/20 transition-all"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-[#030712]/95 backdrop-blur-2xl z-40 flex flex-col justify-between p-6 overflow-y-auto pb-24">
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/[0.08] p-4 rounded-2xl">
              <p className="text-white font-black text-sm uppercase tracking-wide">
                {user.name}
              </p>
              <div className="flex items-center justify-between mt-2 text-[11px] font-mono">
                <span className="text-cyan-400">ID: {user.clientCode}</span>
                <span className="text-zinc-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Secured
                </span>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      isActive
                        ? "bg-cyan-500/10 border border-cyan-500/40 text-white shadow-[0_4px_15px_rgba(34,211,238,0.15)]"
                        : "text-zinc-200 hover:text-white hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <span
                      className={isActive ? "text-cyan-400" : "text-zinc-300"}
                    >
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/[0.08] pt-4 mt-8">
            <button
              onClick={() => {
                setIsMobileOpen(false);
                router.push("/auth/login");
              }}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm w-full rounded-xl active:bg-red-500/20 transition-all"
            >
              <LogOut size={18} />
              <span>Secure Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDENAV */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 h-screen transition-all duration-300 z-30 border-r border-white/[0.08] bg-[#030712]/60 backdrop-blur-xl shadow-[4px_0_30px_rgba(0,0,0,0.5)] ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* FIX TOGGLE: Pus direct aici ca să nu mai fie tăiat de overflow-hidden-ul intern */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-[30px] w-8 h-8 flex items-center justify-center bg-[#070d19] border border-white/[0.15] text-cyan-400 hover:text-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:border-cyan-400 cursor-pointer z-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* CONTAINERUL INTERN - Gestionează corect înălțimea ecranului */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Header Compact - MBANK + Last Login */}
          <div className="h-24 flex items-center px-5 border-b border-white/[0.08] shrink-0">
            <div
              className={`flex items-center gap-3.5 ${isCollapsed ? "mx-auto" : ""}`}
            >
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] shrink-0">
                <Landmark size={20} className="text-cyan-400" />
              </div>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base tracking-[0.15em] text-white uppercase leading-none">
                      MBANK
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 mt-1.5 flex items-center gap-1.5 whitespace-nowrap">
                    <Clock size={12} className="text-cyan-500 shrink-0" />{" "}
                    {lastLogin}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User Profile - Compact Card cu Avatar */}
          {!isCollapsed && (
            <div className="p-3 mx-4 my-3 rounded-xl bg-white/[0.02] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5 tracking-wide truncate">
                  ID: {user.clientCode}
                </p>
              </div>
            </div>
          )}

          {/* Zona de Navigare cu Scrollbar Premium Vizibil */}
          <nav
            className="flex-1 overflow-y-auto px-3 space-y-1 pb-4
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/[0.10]
            hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/30
            [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-xl font-bold group relative border transition-all duration-150 ${
                    isCollapsed ? "justify-center p-3.5" : "gap-3.5 px-4 py-3"
                  } ${
                    isActive
                      ? "bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.08)]"
                      : "bg-transparent border-transparent text-zinc-300 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className={`transition-transform duration-150 group-hover:scale-105 ${isActive ? "text-cyan-400" : "text-zinc-400 group-hover:text-zinc-200"}`}
                  >
                    {item.icon}
                  </div>

                  {!isCollapsed && (
                    <span className="text-sm tracking-wide">{item.name}</span>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-20 bg-[#070d19] border border-white/[0.12] text-white text-xs font-bold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap shadow-2xl z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer static */}
        <div className="p-3 border-t border-white/[0.08] bg-black/[0.2] space-y-2 shrink-0">
          <button
            onClick={() => router.push("/auth/login")}
            className={`flex cursor-pointer items-center rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 w-full group ${
              isCollapsed
                ? "justify-center p-3.5"
                : "gap-3.5 px-4 py-3 text-sm font-bold"
            }`}
          >
            <LogOut
              size={18}
              className="group-hover:translate-x-0.5 transition-transform"
            />
            {!isCollapsed && <span>Secure Exit</span>}
          </button>

          {!isCollapsed ? (
            <div className="text-[10px] text-zinc-400 font-medium text-center pt-1 tracking-wider">
              <p>v2.4.0-premium</p>
              <p className="text-zinc-500 font-mono mt-0.5">© 2026 mbank.fi</p>
            </div>
          ) : (
            <div className="text-[9px] text-zinc-500 text-center font-mono font-bold">
              v2.4
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
