/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./server/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#070605",
        coal: "#0F0C0A",
        panel: "#141110",
        line: "rgba(255,255,255,0.09)",
        saffron: "#FF6B1A",
        haldi: "#FFB800",
        mirchi: "#FF2E63",
        dhaniya: "#00E676",
        gulab: "#FF2E93",
        jamun: "#8B5CF6",
        chai: "#E8B86D",
      },
      fontFamily: {
        display: ["Space Grotesk", "Baloo 2", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "Noto Sans Devanagari", "system-ui", "sans-serif"],
        desi: ["Baloo 2", "Space Grotesk", "Noto Sans Devanagari", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(255,107,26,0.25)",
        card: "0 20px 60px rgba(0,0,0,0.5)",
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        wiggle: "wiggle 2.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0) rotate(var(--rot,0deg))" },
          "50%": { transform: "translateY(-14px) rotate(var(--rot,0deg))" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
