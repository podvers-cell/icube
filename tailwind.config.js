/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "icube-dark": "#1f1f1f",
        "icube-gray": "#242424",
        "icube-light": "#F5F5F5",
        "icube-gold": "#D4AF37",
        "icube-gold-light": "#E8C547",
        "icube-bronze": "#B8860B",
      },
    },
  },
  plugins: [],
};

