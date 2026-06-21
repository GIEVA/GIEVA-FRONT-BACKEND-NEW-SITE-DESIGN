/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: "#1E7F4F",
        primaryDark: "#145A32",
        accent: "#4CAF50",
      },
    },
  },

  plugins: [],
};