"use client";

import { Landmark, Code2, MessageSquare, ShieldCheck } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Protocol",
      links: ["Features", "Analytics", "Security Vault", "Go Engine Spec"],
    },
    {
      title: "Developers",
      links: [
        "API Documentation",
        "Core Ledger Architecture",
        "Open Source Core",
        "System Status",
      ],
    },
    {
      title: "Legal & Regulatory",
      links: [
        "Privacy Policy",
        "Terms of Sovereignty",
        "PCI-DSS Compliance",
        "AML/KYC Framework",
      ],
    },
  ];

  return (
    <footer className="w-full max-w-5xl mx-auto pt-12 pb-8 border-t border-white/[0.2] mt-6 space-y-12">
      {/* TOP REGION: Grid de legături cu contrast ridicat */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
        {/* Brand Info */}
        <div className="flex flex-col items-center md:items-start space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-2 rounded-xl text-cyan-400 border border-white/10">
              <Landmark size={16} />
            </div>
            <span className="font-black text-sm tracking-[0.2em] bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              MBANK
            </span>
          </div>
          <p className="text-[11px] text-gray-300 max-w-[200px] leading-relaxed font-medium">
            Next-generation decentralized financial architecture for sovereign
            asset optimization.
          </p>
        </div>

        {/* Meniuri Link-uri (Schimbat în text-gray-300 pentru lizibilitate maximă) */}
        {footerLinks.map((group, idx) => (
          <div key={idx} className="flex flex-col space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {group.title}
            </span>
            <ul className="flex flex-col space-y-2">
              {group.links.map((link, lIdx) => (
                <li key={lIdx}>
                  <a
                    href="#"
                    className="text-xs text-gray-300 hover:text-cyan-400 transition-colors font-semibold"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* BOTTOM REGION: Disclaimer clar și Certificări */}
      <div className="pt-8 border-t border-white/[0.2] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Copyright clar */}
        <div className="flex flex-col items-center md:items-start space-y-1.5">
          <p className="text-[10px] text-gray-300 font-bold">
            © {currentYear} MBANK Technologies Inc. All international rights
            reserved.
          </p>
          <p className="text-[9px] text-gray-400 max-w-lg text-center md:text-left leading-relaxed font-medium">
            MBANK is a financial technology platform. Banking rails and ledger
            operations are secured via multi-signature Go protocols and
            distributed tier-1 clearing vaults.
          </p>
        </div>

        {/* Iconițe Sociale & Compliance */}
        <div className="flex items-center gap-4 text-gray-300">
          <a
            href="#"
            className="hover:text-cyan-400 transition-colors p-2 bg-white/5 rounded-lg border border-white/10"
            title="Developer Source"
          >
            <Code2 size={14} />
          </a>
          <a
            href="#"
            className="hover:text-purple-400 transition-colors p-2 bg-white/5 rounded-lg border border-white/10"
            title="Community Board"
          >
            <MessageSquare size={14} />
          </a>
          <div className="h-4 w-[1px] bg-white/[0.1]" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-emerald-400 text-[9px] font-black tracking-wider">
            <ShieldCheck size={12} /> SEC-COMPLIANT
          </div>
        </div>
      </div>
    </footer>
  );
}
