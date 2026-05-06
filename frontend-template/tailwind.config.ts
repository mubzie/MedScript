import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      colors: {
        primary: {
          900: "#0A3D2E",
          800: "#0A5C4A",
          700: "#0D7A62",
          600: "#1A9C76",
          100: "#E6F4F0",
          50: "#F0FAF7",
        },
        surface: {
          base: "#FFFFFF",
          raised: "#F8F7F5",
          sunken: "#F3F2F0",
        },
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          tertiary: "#9CA3AF",
          inverse: "#FFFFFF",
        },
        border: {
          default: "#E5E7EB",
          strong: "#D1D5DB",
        },
        status: {
          normal: "#0A5C4A",
          low: "#2563EB",
          high: "#C84B31",
          amber: "#B45309",
          neutral: "#6B7280",
        },
        role: {
          pharmacist: "#7C3AED",
          doctor: "#0A5C4A",
          patient: "#B45309",
        },
      },
      animation: {
        ping: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      fontSize: {
        "2xs": "11px",
        xs: "12px",
        sm: "13px",
        base: "14px",
        lg: "16px",
        xl: "18px",
        "2xl": "20px",
        "3xl": "24px",
        "4xl": "32px",
      },
      letterSpacing: {
        wide: "0.03em",
        wider: "0.05em",
      },
    },
  },
  plugins: [],
} satisfies Config;
