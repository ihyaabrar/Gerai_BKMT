"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ConfirmOptions {
  judul: string;
  pesan: React.ReactNode;
  /** Teks tombol konfirmasi. Default: "Hapus". */
  labelKonfirmasi?: string;
  /** "destruktif" memberi tombol merah, "normal" memberi tombol emerald. */
  nada?: "destruktif" | "normal";
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

/**
 * Dialog konfirmasi menggantikan `confirm()` bawaan browser, yang
 * memblokir seluruh tab, tidak bisa di-style, dan tampil berbeda di
 * setiap peramban.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  judul,
  pesan,
  labelKonfirmasi = "Hapus",
  nada = "destruktif",
}: ConfirmDialogProps) {
  const [memproses, setMemproses] = useState(false);

  const handleConfirm = async () => {
    if (memproses) return;
    setMemproses(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setMemproses(false);
    }
  };

  const destruktif = nada === "destruktif";

  return (
    <Dialog open={open} onOpenChange={(next) => !memproses && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex gap-4">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              destruktif ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-brand-900">{judul}</h2>
            <div className="text-sm text-slate-500 mt-1 break-words">{pesan}</div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={memproses}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={memproses}
            className={destruktif ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            {memproses ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              labelKonfirmasi
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PendingConfirm extends ConfirmOptions {
  aksi: () => void | Promise<void>;
}

/**
 * Hook praktis: `konfirmasi({ judul, pesan, aksi })` menggantikan
 * `if (!confirm(...)) return;` di halaman, lalu render `<dialog />`.
 */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const konfirmasi = useCallback((options: PendingConfirm) => {
    setPending(options);
  }, []);

  const dialog = pending ? (
    <ConfirmDialog
      open
      onOpenChange={(next) => !next && setPending(null)}
      onConfirm={pending.aksi}
      judul={pending.judul}
      pesan={pending.pesan}
      labelKonfirmasi={pending.labelKonfirmasi}
      nada={pending.nada}
    />
  ) : null;

  return { konfirmasi, dialog };
}
