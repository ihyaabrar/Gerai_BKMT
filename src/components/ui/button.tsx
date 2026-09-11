import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gold";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-lg font-semibold " +
      "transition-colors duration-150 " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 " +
      "focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
      "disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      // Aksi utama: hijau rata tanpa gradien
      default: "bg-brand-600 text-white hover:bg-brand-700",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      outline:
        "border border-border bg-white text-slate-700 hover:bg-surface-sunken hover:text-brand-800",
      secondary: "bg-surface-sunken text-slate-700 hover:bg-brand-50 hover:text-brand-800",
      ghost: "text-slate-600 hover:bg-surface-sunken hover:text-brand-800",
      link: "text-brand-600 underline-offset-4 hover:underline",
      gold: "bg-gold-400 text-brand-950 hover:bg-gold-300",
    };

    const sizes = {
      default: "h-10 px-4 text-sm",
      sm: "h-9 rounded-lg px-3 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 rounded-lg",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
