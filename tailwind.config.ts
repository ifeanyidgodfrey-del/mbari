import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parch: "#F5F0E4",
        parchLight: "#FAF6ED",
        parchDark: "#F0E8D4",
        ink: "#1C1608",
        inkSoft: "#3A2E18",
        inkMuted: "#3D3425",
        inkFaint: "#8B7A5E",
        gold: "#8B7040",
        goldLight: "#C4A862",
        green: "#2D7A3A",
        orange: "#D4882A",
        red: "#B83232",
        border: "#D8CDB4",
        borderLight: "#E8DFCC",
        navBg: "#1C1608",
        white: "#FFFDF7",
      },
      fontFamily: {
        serif: ["Libre Baskerville", "Georgia", "serif"],
        sans: ["Source Sans 3", "system-ui", "sans-serif"],
      },
      animation: {
        livepulse: "livepulse 2s ease-in-out infinite",
      },
      keyframes: {
        livepulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
