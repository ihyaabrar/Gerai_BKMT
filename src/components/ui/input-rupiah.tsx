"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { angkaDariTeks, teksRibuan } from "@/lib/uang";

interface InputRupiahProps extends Omit<InputProps, "value" | "onChange" | "type"> {
  /** Angka bulat, atau null bila belum diisi. */
  nilai: number | null;
  onNilai: (nilai: number | null) => void;
}

/**
 * Isian uang dengan titik ribuan ("150.000"). Di HP memunculkan papan angka.
 * Tanpa titik, "1500000" dan "150000" mudah tertukar saat kasir terburu-buru.
 */
export const InputRupiah = React.forwardRef<HTMLInputElement, InputRupiahProps>(
  ({ nilai, onNilai, className, ...props }, ref) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
        Rp
      </span>
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={teksRibuan(nilai)}
        onChange={(e) => onNilai(angkaDariTeks(e.target.value))}
        className={cn("pl-10 tabular-nums", className)}
        {...props}
      />
    </div>
  )
);
InputRupiah.displayName = "InputRupiah";
