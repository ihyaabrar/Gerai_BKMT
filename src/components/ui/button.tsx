import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gold";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
      "transition-all duration-150 active:scale-[0.98] " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 " +
      "focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
      "disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      // Aksi utama: gradien hijau seperti pada desain
      default:
        "bg-brand-action text-white shadow-sm hover:brightness-110 hover:shadow-card",
      destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
      outline:
        "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50 hover:border-brand-300",
      secondary: "bg-brand-50 text-brand-800 hover:bg-brand-100",
      ghost: "text-brand-800 hover:bg-brand-50",
      link: "text-brand-600 underline-offset-4 hover:underline",
      gold: "bg-gold-400 text-brand-950 shadow-sm hover:bg-gold-300",
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
