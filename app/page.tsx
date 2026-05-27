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
    <>
      {/* Navbar-ul apare ACUM doar pe această pagină */}
      <Navbar />

      <main className="flex flex-col flex-grow w-full">
        <Hero />
        <Ticker />
        <Features />
        <Stats />
        <Security />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
