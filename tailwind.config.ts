import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "600px",
        md: "728px",
        lg: "984px",
        xl: "1240px",
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-instrument-sans)"],
        heading: ["var(--font-instrument-sans)"],
        serif: ["var(--font-playfair-display)"],
      },
      colors: {
        // Domain-specific renkler (theme-aware: tenant override edebilir)
        "sac-primary": "var(--sac-primary)",
        "sac-primary-lightest": "var(--sac-primary-lightest)",
        "sac-icon-primary": "var(--sac-icon-primary)",
        "sac-avatar-bg": "var(--sac-avatar-bg)",
        "sac-border-light": "var(--sac-border-light)",
        "sac-muted": "var(--sac-muted)",
        "sac-icon-light": "var(--sac-icon-light)",
        "sac-icon-bg": "var(--sac-icon-bg)",
        "sac-primary-muted": "var(--sac-primary-muted)",

        "sac-red": "#D22D2D",
        "sac-red-light": "#FCEFEF",

        "sac-yellow": "#F9BC06",
        "sac-yellow-light": "#FFFAEC",

        "sac-blue": "#367CFE",
        "sac-blue-light": "#E6EAF2",

        "sac-border-blue": "#b8c7dd",
        "sac-form-bg": "#fcfcfa",

        /* For Graphs */
        "sac-graph-green-tone-light": "#1DC355",
        "sac-graph-green-tone-dark": "#3A9E5F",
        "sac-graph-green-tone-darkest": "#125427",

        "sac-section-background": "#202124",

        // Shadcn Colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          dark: "hsl(var(--primary-dark))",
          muted: "hsl(var(--primary-muted))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "placeholder-breathe": {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.95)" },
          "50%": { opacity: "0.6", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "placeholder-breathe": "placeholder-breathe 4s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;