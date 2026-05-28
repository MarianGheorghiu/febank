import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NotificationProvider from "./components/ui/NotificationProvider";

// Adăugăm display: "swap" pentru a asigura încărcarea fluidă a textului
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MBank | Next-Gen Liquid Fintech",
  description: "Next-generation digital banking with liquid glass interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-[#0a0d14] scroll-smooth text-white"
      data-scroll-behavior="smooth"
    >
      <body
        /* 
          Am eliminat px-4 md:px-8 lg:px-12 de aici pentru ca Sidenav-ul să fie lipit perfect de margini.
          Dacă paginile de Login/Register au nevoie de padding, îl punem direct în containerele lor (ceea ce au deja).
        */
        className={`${inter.className} antialiased relative min-h-screen overflow-x-hidden w-full flex flex-col`}
      >
        {/* Fundalul fluid global (rămâne intact, arată genial) */}
        <div className="absolute inset-0 max-w-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-5%] left-[-10%] w-[260px] sm:w-[500px] h-[260px] sm:h-[500px] rounded-full bg-cyan-500/10 blur-[60px] sm:blur-[120px] animate-float-1" />
          <div className="absolute top-[35%] right-[-5%] w-[280px] sm:w-[600px] h-[280px] sm:h-[600px] rounded-full bg-purple-600/10 blur-[80px] sm:blur-[150px] animate-float-2" />
        </div>

        {/* Containerul principal */}
        <div className="relative z-10 w-full flex flex-col flex-grow">
          {children}
        </div>

        {/* CONTAINERUL GLOBAL DE POPUP TOASTS 👇 */}
        <NotificationProvider />
      </body>
    </html>
  );
}
