import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: "#F4EFE6",
        ink: "#182026",
        brass: "#9B6C38",
        olive: "#55634A",
        danger: "#A44033",
        success: "#2D6A4F",
        slate: "#6E7C87"
      },
      boxShadow: {
        panel: "0 18px 48px rgba(24, 32, 38, 0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
