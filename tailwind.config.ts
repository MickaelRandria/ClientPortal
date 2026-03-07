import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      colors: {
        // shadcn tokens
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Design system custom tokens
        bg: "#F4F5F7",
        surface: "rgba(255,255,255,0.72)",
        "surface-solid": "#FFFFFF",
        "surface-hover": "rgba(255,255,255,0.88)",
        mint: {
          DEFAULT: "#34D399",
          hover: "#10B981",
          bg: "rgba(52,211,153,0.10)",
          "bg-active": "rgba(52,211,153,0.18)",
          text: "#065F46",
        },
        yellow: {
          bg: "rgba(251,191,36,0.12)",
          text: "#92400E",
        },
        blue: {
          bg: "rgba(59,130,246,0.10)",
          text: "#1E40AF",
        },
        red: {
          bg: "rgba(239,68,68,0.10)",
          text: "#991B1B",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "16px",
        "3xl": "28px",
        btn: "14px",
        pill: "100px",
      },
      boxShadow: {
        glass:
          "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.04)",
        "glass-hover":
          "0 0 0 1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.04), 0 24px 48px rgba(0,0,0,0.07)",
        "mint-glow": "0 8px 24px rgba(52,211,153,0.20)",
        "logo-glow":
          "0 0 0 1px rgba(52,211,153,0.2), 0 4px 16px rgba(52,211,153,0.25)",
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
