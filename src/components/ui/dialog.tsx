"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Di layar kecil dialog tampil sebagai sheet yang menempel di bawah dan
 * bisa di-scroll. Sebelumnya dialog selalu berada di tengah tanpa batas
 * tinggi, sehingga form panjang (mis. pembayaran kasir) terpotong di HP
 * tanpa bisa di-scroll sama sekali.
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="relative z-50 w-full sm:w-auto max-h-[92dvh] sm:max-h-[90dvh] flex">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative bg-white shadow-lg w-full overflow-y-auto",
        // Sheet di mobile, kartu mengambang di layar >=sm.
        "rounded-t-2xl sm:rounded-lg",
        "p-5 sm:p-6 sm:max-w-md sm:mx-4",
        className
      )}
    >
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4 pr-8", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg sm:text-xl font-semibold", className)}>{children}</h2>;
}

export function DialogTrigger({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode; [key: string]: any }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props);
  }
  return <button {...props}>{children}</button>;
}
