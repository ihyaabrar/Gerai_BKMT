import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NADA, type Nada } from "@/components/ui/nada";
import { cn } from "@/lib/utils";

/**
 * Kartu angka ringkasan — satu bentuk untuk seluruh aplikasi: label di atas,
 * angka besar, catatan kecil, ikon berwarna di kanan.
 */
export function StatCard({
  label,
  nilai,
  icon: Icon,
  nada = "brand",
  catatan,
  negatif = false,
  loading = false,
}: {
  label: string;
  nilai: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  nada?: Nada;
  catatan?: React.ReactNode;
  negatif?: boolean;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <p
                title={typeof nilai === "string" ? nilai : undefined}
                className={cn(
                  "mt-1.5 text-xl 2xl:text-2xl font-extrabold tracking-tight leading-tight break-words",
                  negatif ? "text-rose-600" : "text-brand-900"
                )}
              >
                {nilai}
              </p>
            )}
            {!loading && catatan && (
              <p className="text-xs text-slate-500 mt-1.5 leading-snug">{catatan}</p>
            )}
          </div>
          <span className={cn("shrink-0 h-10 w-10 rounded-xl flex items-center justify-center", NADA[nada])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
