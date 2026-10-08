"use client";
import { notifyOperation } from "@/app/components/ui/OperationNotification";
export function notifyCardOperation(title: string, description: string, error = false) {
  notifyOperation(title, description, error, "Card administration");
}
