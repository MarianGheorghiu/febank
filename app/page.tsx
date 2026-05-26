import Navbar from "@/app/components/layout/Navbar";
import Hero from "@/app/components/landing/Hero";
import Ticker from "@/app/components/landing/Ticker";
import Features from "@/app/components/landing/Features";
import Stats from "@/app/components/landing/Stats";
import Security from "@/app/components/landing/Security";
import CTA from "@/app/components/landing/CTA";
import Footer from "@/app/components/layout/Footer";

export default function Home() {
  return (
    <main className="flex flex-col flex-grow w-full">
      {/* 1. Primirea Clientului */}
      <Hero />

      {/* 2. Monitorizare Curs Cripto/Fiat */}
      <Ticker />

      {/* 3. Wealth Terminal Grid */}
      <Features />

      {/* 4. Live Analytics & Volume */}
      <Stats />

      {/* 5. Securitate compilată în Go */}
      <Security />

      {/* 6. Punctul de Conversie Premium */}
      <CTA />

      {/* 7. Încheierea Instituțională */}
      <Footer />
    </main>
  );
}
