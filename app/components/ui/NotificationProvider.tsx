"use client";

import { Toaster } from "sonner";

export default function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      visibleToasts={5}
      // Stil pentru containerul general pe mobile (le forțăm jos pe ecrane mici)
      className="mbank-toast-container"
      toastOptions={{
        // Resetează stilurile implicite urâte ca să avem control 100% din Tailwind
        unstyled: true,
        className: "w-full sm:w-[420px] pointer-events-auto",
      }}
    />
  );
}
