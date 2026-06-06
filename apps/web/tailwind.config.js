/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF7",
          100: "#FAF7F2",
          200: "#F3EEE4",
          300: "#EAE2D3",
        },
        ink: {
          DEFAULT: "#1A1714",
          soft: "#3A352E",
          muted: "#6F6A60",
          faint: "#9A9489",
        },
        line: "#ECE5D8",
        forge: {
          // warm ember accent — the brand's "forge" heat
          50: "#FFF4ED",
          100: "#FFE6D5",
          400: "#FB7A3C",
          500: "#F2611C",
          600: "#D94E0E",
        },
        sage: {
          100: "#E7F0E6",
          500: "#5C8A5A",
          600: "#477A45",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Outfit"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,23,20,0.04), 0 8px 24px -12px rgba(26,23,20,0.10)",
        "soft-lg": "0 2px 4px rgba(26,23,20,0.05), 0 24px 48px -20px rgba(26,23,20,0.18)",
        card: "0 1px 0 rgba(26,23,20,0.03), 0 10px 30px -18px rgba(26,23,20,0.22)",
        glow: "0 0 0 1px rgba(242,97,28,0.18), 0 12px 32px -12px rgba(242,97,28,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
