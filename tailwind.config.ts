import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
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
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        cyber: {
          glow: "hsl(var(--cyber-glow))",
          blue: "hsl(var(--cyber-blue))",
          red: "hsl(var(--cyber-red))",
          orange: "hsl(var(--cyber-orange))",
          purple: "hsl(var(--cyber-purple))",
          grid: "hsl(var(--cyber-grid))",
        },
        mitre: {
          recon: "hsl(var(--mitre-recon))",
          resource: "hsl(var(--mitre-resource))",
          initial: "hsl(var(--mitre-initial))",
          execution: "hsl(var(--mitre-execution))",
          persistence: "hsl(var(--mitre-persistence))",
          privilege: "hsl(var(--mitre-privilege))",
          defense: "hsl(var(--mitre-defense))",
          credential: "hsl(var(--mitre-credential))",
          discovery: "hsl(var(--mitre-discovery))",
          lateral: "hsl(var(--mitre-lateral))",
          collection: "hsl(var(--mitre-collection))",
          command: "hsl(var(--mitre-command))",
          exfiltration: "hsl(var(--mitre-exfiltration))",
          impact: "hsl(var(--mitre-impact))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 8px hsl(var(--primary) / 0.4)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 16px hsl(var(--primary) / 0.6)" },
        },
      },
      transitionTimingFunction: {
        "standard": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
        "slide-down": "slide-down 0.15s ease-out",
        "blink": "blink 1s step-end infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config;
