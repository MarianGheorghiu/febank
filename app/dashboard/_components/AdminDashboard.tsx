"use client";
import AdminCommandCenter from "@/app/components/ui/admin/AdminCommandCenter";
export default function AdminDashboard({ name }: { name: string }) {
  return <div className="w-full min-w-0 animate-fade-in"><h1 className="sr-only">Admin Control · {name}</h1><AdminCommandCenter /></div>;
}
