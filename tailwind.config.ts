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
        parch: "#FAF8F2",
        parchLight: "#FFFFFF",
        parchDark: "#F2EDE0",
        ink: "#110E04",
        inkSoft: "#2E2410",
        inkMuted: "#3A2E18",
        inkFaint: "#7A6A4A",
        gold: "#B87E20",
        goldLight: "#D4A832",
        green: "#2D7A3A",
        orange: "#D4882A",
        red: "#B83232",
        border: "#D8CDB4",
        borderLight: "#EBE5D5",
        navBg: "#0D0A02",
        white: "#FFFFFF",
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
