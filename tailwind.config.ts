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
        // Dark Mode Cinematic Palette - Netflix & Modern Cinema
        void: "#0B0C10",          // Nền chính tối điện ảnh
        surface: "#12141C",       // Bề mặt khối phụ / card
        panel: "#161922",         // Khối panel / bar
        "border-navy": "rgba(255, 255, 255, 0.1)",
        borderNavy: "rgba(255, 255, 255, 0.1)",
        background: "#0B0C10",
        surfaceBorder: "rgba(255, 255, 255, 0.1)",
        accent: {
          red: "#E50914",         // Đỏ điện ảnh Cinematic Red
          redHover: "#B80710",    // Đỏ đậm hover
          gold: "#F5C518",        // Vàng kim điện ảnh IMDb/Cinema Gold
          cyan: "#E50914",
          purple: "#ec4899",
        },
        "gold-text": "#F5C518",
        goldText: "#F5C518",
        sweetbox: "#ec4899",
        cgvRed: "#E50914",
        cgvRedDark: "#B80710",
        cgvDark: "#0B0C10",
        cgvParchment: "#12141C",
        cgvGold: "#F5C518",
        cgvBorder: "rgba(255, 255, 255, 0.1)",
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
          "50%": { filter: "hue-rotate(45deg) brightness(1.1)" },
        },
      },
      animation: {
        shimmer: "shimmer 3s infinite linear",
        hologram: "hologram 6s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
