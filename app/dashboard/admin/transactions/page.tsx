"use client";
import { useUser } from "@/app/context/UserContext";
import TransactionsWorkspace from "@/app/components/ui/admin/transactions/TransactionsWorkspace";
export default function AdminTransactionsPage() {
  const { user, loading } = useUser();
  if (loading) return <p role="status" className="p-6 text-xs text-slate-400">Loading administrator session…</p>;
  if (!user || user.role !== "admin") return <p role="alert" className="p-6 text-rose-300">Administrator access required.</p>;
  return <TransactionsWorkspace key={user.email} actor={{ email: user.email, role: user.role }}/>;
}
