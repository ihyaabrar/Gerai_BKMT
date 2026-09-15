import type React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NADA, type Nada } from "@/components/ui/nada";
import { cn } from "@/lib/utils";

/** Kartu pintasan ke halaman lain, dipakai di halaman ringkasan. */
export function ShortcutCard({
  href,
  label,
  desc,
  icon: Icon,
  nada = "brand",
}: {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  nada?: Nada;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-border bg-white p-5 sm:p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0", NADA[nada])}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
      </div>
      <p className="mt-4 font-bold text-slate-900">{label}</p>
      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{desc}</p>
    </Link>
  );
}
