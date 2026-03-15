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
        bg: "#09040F",
        surface: "rgba(18, 10, 28, 0.72)",
        "surface-solid": "#120A1C",
        "surface-hover": "rgba(22, 12, 36, 0.88)",
        purple: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          bg: "rgba(139, 92, 246, 0.15)",
          "bg-active": "rgba(139, 92, 246, 0.25)",
          text: "#FFFFFF",
        },
        yellow: {
          bg: "rgba(251,191,36,0.12)",
          text: "#FBBF24",
        },
        blue: {
          bg: "rgba(59,130,246,0.10)",
          text: "#60A5FA",
        },
        red: {
          bg: "rgba(239,68,68,0.10)",
          text: "#F87171",
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
          "0 0 0 1px rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.4)",
        "glass-hover":
          "0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3), 0 24px 48px rgba(0,0,0,0.6)",
        "purple-glow": "0 8px 32px rgba(139, 92, 246, 0.35)",
        "logo-glow":
          "0 0 0 1px rgba(139, 92, 246, 0.2), 0 4px 16px rgba(139, 92, 246, 0.4)",
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
