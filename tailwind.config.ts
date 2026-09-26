import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0c10",
        surface: "#14161d",
        surfaceBorder: "#222531",
        accent: {
          red: "#e50914",
          redHover: "#f40612",
          gold: "#f5c518",
          cyan: "#00e5ff",
          purple: "#8a2be2",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        hologram: {
          "0%, 100%": { filter: "hue-rotate(0deg) brightness(1)" },
          "50%": { filter: "hue-rotate(90deg) brightness(1.2)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s infinite linear",
        hologram: "hologram 4s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
