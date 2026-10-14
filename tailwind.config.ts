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
        // Bảng màu Trắng chủ đạo & Xanh da trời (Sky Blue) tiêu chuẩn
        void: "#ffffff",          // Nền trắng chủ đạo
        surface: "#ffffff",       // Bề mặt card/modal trắng
        panel: "#f8fafc",         // Panel phụ slate-50
        "border-navy": "#e2e8f0", // Viền slate-200
        borderNavy: "#e2e8f0",
        background: "#ffffff",
        surfaceBorder: "#e2e8f0",
        accent: {
          red: "#0284c7",         // Sky-600 chuẩn cho nút bấm hành động chính
          redHover: "#0369a1",    // Sky-700 hover
          gold: "#0284c7",        // Sky-600 điểm nhấn
          cyan: "#0ea5e9",        // Sky-500
          purple: "#818cf8",      // Sweetbox tím nhẹ
        },
        "gold-text": "#0369a1",
        goldText: "#0369a1",
        sweetbox: "#ec4899",
        // Token Beta Cinemas tương thích
        betaNavy: "#ffffff",
        betaBlue: "#ffffff",
        betaBlueLight: "#f1f5f9",
        betaCyan: "#0ea5e9",
        betaOrange: "#0284c7",
        betaPink: "#ec4899",
        betaGray: "#f8fafc",
        betaBorder: "#e2e8f0",
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
