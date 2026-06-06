/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Soft, friendly internal-tools palette.
        cream: {
          50: "#fdfcfa",
          100: "#faf8f5",
          200: "#f3efe9",
        },
        ink: {
          900: "#171717",
          800: "#1f1f1f",
          700: "#2b2b2b",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        "card-hover":
          "0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 6px rgba(16, 24, 40, 0.05)",
      },
    },
  },
  plugins: [],
};
