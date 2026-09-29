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
        // Bảng màu Navy / Vàng đồng sang trọng
        void: "#070b14",          // Nền tối sâu nhất thay đen thuần
        surface: "#0f1826",       // Bề mặt card/modal navy đậm
        panel: "#131f33",         // Panel phụ cho combo, thông tin vé
        "border-navy": "#25324a", // Viền navy trầm thay neutral-700/800
        borderNavy: "#25324a",
        background: "#070b14",
        surfaceBorder: "#25324a",
        accent: {
          red: "#c9a227",         // Vàng đồng quý phái (CTA chính, ghế chọn)
          redHover: "#a8871f",    // Vàng đồng hover
          gold: "#d9b95c",        // Chữ nổi bật/giá tiền
          cyan: "#8a99b5",        // Xanh xám ánh bạc thanh lịch (không neon)
          purple: "#8a5a8f",      // Sweetbox tím mận trầm
        },
        "gold-text": "#d9b95c",
        goldText: "#d9b95c",
        sweetbox: "#8a5a8f",
        // Giữ tương thích token Beta Cinemas
        betaNavy: "#070b14",
        betaBlue: "#0f1826",
        betaBlueLight: "#131f33",
        betaCyan: "#8a99b5",
        betaOrange: "#c9a227",
        betaPink: "#8a5a8f",
        betaGray: "#131f33",
        betaBorder: "#25324a",
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
