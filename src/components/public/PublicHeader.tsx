"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, LogIn } from "lucide-react";

interface PublicHeaderProps {
  orgName: string;
  singkatan?: string | null;
  logoUrl?: string | null;
}

export function PublicHeader({ orgName, singkatan, logoUrl }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Set initial state berdasarkan scroll position saat ini
    setScrolled(window.scrollY > 60);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Beranda", href: "#beranda" },
    { label: "Profil", href: "#profil" },
    { label: "Berita", href: "#berita" },
    { label: "Pengurus", href: "#pengurus" },
    { label: "Gerai", href: "#gerai" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-border shadow-card"
          : "bg-white/70 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-xl object-cover shadow-md" />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gold-400 flex items-center justify-center">
              <span className="text-brand-950 font-extrabold text-[10px]">BKMT</span>
            </div>
          )}
          <div>
            <p className="font-bold text-sm leading-tight text-slate-900">
              {singkatan || "BKMT"}
            </p>
            <p className="text-xs leading-tight text-slate-500">
              Bersama Umat, Membangun Masyarakat
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 transition-colors hover:text-brand-700 hover:bg-brand-50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-2 bg-brand-600 text-white px-4 h-10 rounded-lg text-sm font-semibold transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <LogIn className="h-4 w-4" />
            Login Kasir
          </Link>
          <button
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            className="md:hidden p-2 rounded-lg text-slate-600 transition-colors hover:bg-surface-sunken"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-border px-6 py-4 space-y-1 shadow-card">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="flex items-center gap-2 mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3 rounded-xl text-sm font-semibold"
          >
            <LogIn className="h-4 w-4" />
            Login ke Kasir
          </Link>
        </div>
      )}
    </header>
  );
}
