import type { Config } from "tailwindcss";

/**
 * Token desain BKMT Kubu Raya.
 *
 * Palet diambil dari desain: hijau tua pekat untuk sidebar/footer, hijau
 * sedang untuk aksi utama, latar mint sangat muda untuk halaman, dan emas
 * dari logo sebagai aksen. Semua warna dipakai lewat nama peran (brand,
 * gold, surface) supaya tidak kembali tercecer jadi green/emerald/blue
 * yang dipilih per halaman.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F1FAF4",
          100: "#DDF2E4",
          200: "#BCE4CB",
          300: "#8DCFAA",
          400: "#57B382",
          500: "#2F9862",
          600: "#1E7A4D", // aksi utama
          700: "#17603D",
          800: "#134C31",
          900: "#0E3B26",
          950: "#072518", // sidebar & footer
        },
        gold: {
          50: "#FEFAE8",
          100: "#FDF2C3",
          200: "#FBE58A",
          300: "#F8D247",
          400: "#F5C518", // logo BKMT
          500: "#E0AC08",
          600: "#B98305",
          700: "#935F08",
          800: "#7A4C0F",
          900: "#683F12",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#FBFDFC", // latar halaman nyaris putih
          sunken: "#F4F8F6",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // Antarmuka aplikasi
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Judul besar halaman publik
        display: ["var(--font-display)", "Georgia", "serif"],
        // Aksen tulisan tangan pada slogan
        script: ["var(--font-script)", "cursive"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "0.875rem",
      },
      boxShadow: {
        // Gaya minimalis: bayangan nyaris tak terlihat, kedalaman
        // dibentuk oleh garis tepi tipis, bukan oleh bayangan tebal.
        card: "0 1px 2px rgba(15, 42, 30, 0.04)",
        "card-hover": "0 4px 16px -6px rgba(15, 42, 30, 0.12)",
        panel: "0 20px 48px -28px rgba(7, 37, 24, 0.35)",
      },
      backgroundImage: {
        // Gradien yang berulang di sidebar, footer, dan banner sambutan
        // Sidebar tetap hijau tua tapi rata, tanpa gradasi mencolok.
        "brand-deep": "linear-gradient(180deg, #10402A 0%, #0C3421 100%)",
        // Latar hero halaman publik: mint sangat muda memudar ke putih.
        "brand-hero": "linear-gradient(150deg, #F2FAF5 0%, #FFFFFF 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
