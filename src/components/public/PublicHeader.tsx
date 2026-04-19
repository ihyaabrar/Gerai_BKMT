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
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-xl object-cover shadow-md" />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">{singkatan?.slice(0, 2) || "BK"}</span>
            </div>
          )}
          <div>
            <p className={`font-bold text-sm leading-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
              {singkatan || "BKMT"}
            </p>
            <p className={`text-xs leading-tight transition-colors ${scrolled ? "text-gray-500" : "text-emerald-200"}`}>
              Kubu Raya
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                scrolled
                  ? "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 transition-all"
          >
            <LogIn className="h-4 w-4" />
            Login Kasir
          </Link>
          <button
            className={`md:hidden p-2 rounded-xl transition-colors ${
              scrolled ? "hover:bg-gray-100 text-gray-700" : "hover:bg-white/10 text-white"
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-md border-t border-gray-100 px-6 py-4 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
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
