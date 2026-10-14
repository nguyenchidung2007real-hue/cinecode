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
        // Bảng màu CGV Cinemas - Đỏ Burgundy / Crimson & Rạp chiếu cổ điển
        void: "#fdfcf0",          // Nền kem vintage rạp chiếu
        surface: "#ffffff",       // Bề mặt card/modal trắng
        panel: "#faf8f2",         // Panel phụ rạp phim ấm áp
        "border-navy": "#e5e0d8", // Viền ấm
        borderNavy: "#e5e0d8",
        background: "#fdfcf0",
        surfaceBorder: "#e5e0d8",
        accent: {
          red: "#e71a0f",         // CGV Crimson Red chuẩn rạp chiếu
          redHover: "#c81007",    // CGV Dark Red hover
          gold: "#c5a059",        // Vàng kim vintage cinema
          cyan: "#e71a0f",        // Primary red
          purple: "#ec4899",      // Sweetbox hồng đôi
        },
        "gold-text": "#c5a059",
        goldText: "#c5a059",
        sweetbox: "#ec4899",
        // CGV Cultureplex tokens
        cgvRed: "#e71a0f",
        cgvRedDark: "#c81007",
        cgvDark: "#1c1c1c",
        cgvParchment: "#fdfcf0",
        cgvGold: "#c5a059",
        cgvBorder: "#e5e0d8",
        betaNavy: "#1c1c1c",
        betaBlue: "#ffffff",
        betaBlueLight: "#faf8f2",
        betaCyan: "#e71a0f",
        betaOrange: "#e71a0f",
        betaPink: "#ec4899",
        betaGray: "#faf8f2",
        betaBorder: "#e5e0d8",
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
