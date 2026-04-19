"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogIn } from "lucide-react";

interface PublicHeaderProps {
  orgName: string;
  singkatan?: string | null;
  logoUrl?: string | null;
}

export function PublicHeader({ orgName, singkatan, logoUrl }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Beranda", href: "#beranda" },
    { label: "Profil", href: "#profil" },
    { label: "Berita", href: "#berita" },
    { label: "Pengurus", href: "#pengurus" },
    { label: "Gerai", href: "#gerai" },
  ];

  return (
    <header className="bg-emerald-800 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Nama */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo BKMT" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm">
              {singkatan?.slice(0, 2) || "BK"}
            </div>
          )}
          <div>
            <p className="font-bold text-sm leading-tight">{singkatan || "BKMT"}</p>
            <p className="text-emerald-200 text-xs leading-tight hidden sm:block">Kubu Raya</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Login Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex items-center gap-2 bg-white text-emerald-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Login Kasir</span>
          </Link>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-emerald-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-emerald-700 px-4 py-2 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
