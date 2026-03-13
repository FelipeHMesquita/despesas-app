/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#0a0a0f",
          1: "#12121a",
          2: "#1a1a26",
          3: "#242434",
        },
        accent: {
          DEFAULT: "#6ee7b7",
          dim: "#34d399",
          glow: "rgba(110, 231, 183, 0.15)",
        },
        danger: "#f87171",
        muted: "#64748b",
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
