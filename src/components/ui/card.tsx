import * as React from "react";
import { cn } from "@/lib/utils";
import { NADA, type Nada } from "@/components/ui/nada";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card border border-border bg-white shadow-card",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-[15px] font-semibold text-slate-900 leading-tight tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * Tanpa CardHeader di atasnya, isi kartu mendapat padding atas yang sama
 * dengan sisi lain (first:). Setelah CardHeader, padding atas nol karena
 * header sudah memberi jarak.
 *
 * Versi sebelumnya menulis "pt-0 sm:pt-0". Halaman yang menimpanya dengan
 * "pt-5" hanya mengganti pt-0; sm:pt-0 tetap menang di layar >=640 px,
 * sehingga isi kartu menempel ke garis atas di laptop.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 pb-5 first:pt-5 sm:px-6 sm:pb-6 sm:first:pt-6", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

/** Ikon kecil berwarna di samping judul kartu. */
function CardIcon({ icon: Icon, nada = "brand" }: { icon: React.ComponentType<{ className?: string }>; nada?: Nada }) {
  return (
    <span className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", NADA[nada])}>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

export { Card, CardHeader, CardTitle, CardContent, CardIcon };
