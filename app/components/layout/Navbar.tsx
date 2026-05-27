"use client";

import { useState } from "react";
import { Landmark, Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Analytics", href: "#stats" },
    { name: "Security", href: "#security" },
  ];

  return (
    // Folosește exact aceleași clase de padding ca body-ul din layout
    <nav className="fixed top-6 left-0 right-0 z-50 px-4 md:px-8 lg:px-12">
      {/* Containerul Liquid Glass Premium */}
      <div className="max-w-5xl mx-auto bg-gradient-to-b from-white/[0.09] to-white/[0.02] backdrop-blur-xl border border-white/[0.15] shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-2xl md:rounded-full px-6 py-3 transition-all duration-300">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="#"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-2 rounded-xl text-cyan-400 border border-white/10 transition-all group-hover:rotate-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Landmark size={18} />
            </div>
            <span className="font-black text-base tracking-[0.2em] bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              MBANK
            </span>
          </Link>

          {/* Navigație Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Acțiuni Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/auth/login"
              className="text-[11px] font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-white to-gray-100 text-black px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest hover:from-cyan-400 hover:to-cyan-300 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
            >
              Open Account
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white p-1 cursor-pointer active:scale-95 transition-transform"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-2 flex flex-col gap-3 border-t border-white/[0.08] mt-3 animate-in fade-in slide-in-from-top-4 duration-300">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-gray-300 hover:text-white px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="h-[1px] bg-white/[0.08] my-1" />
            <Link
              onClick={() => setIsOpen(false)}
              href="/auth/login"
              className="text-center py-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              onClick={() => setIsOpen(false)}
              href="/auth/register"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              Open Account
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
