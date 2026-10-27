import { findManagedUser } from "../user-management/store";
import type { UserProps } from "@/app/lib/types/auth";

export function determineRole(email: string): UserProps["role"] {
  const managed = findManagedUser(email);
  return managed ? managed.role === "ADMIN" && managed.status === "ACTIVE" ? "admin" : "client" : email.toLowerCase().trim().endsWith("@admin.com") ? "admin" : "client";
}

export function createMockSession(email: string, name: string): UserProps {
  const role = determineRole(email);
  return { name, email, role, clientCode: role === "admin" ? "ROOT-CORE-X" : `MB-${Math.floor(1000 + Math.random() * 9000)}-Y` };
}
