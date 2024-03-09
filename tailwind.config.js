/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      fontFamily: {
        Sunshiney: ["Sunshiney", "cursive"],
        SourceSerifPro: ["Source Serif Pro", "serif"],
      },
      colors: {
        'pink-trans': 'rgba(255, 0, 194, 0.80)',
        'orange-trans': 'rgba(255, 77, 0, 0.80)',
        'white-08' : 'rgba(255, 255, 255, 0.08)',
        'black-90' : 'rgba(0, 0, 0, 0.90)',
        'todo-bg': 'rgba(255, 77, 0, 0.16)',
      },
      boxShadow: {
        'custom-orange': '-1px 1px 4px 0px rgba(255, 77, 0, 0.80), 1px -1px 4px 0px rgba(255, 0, 184, 0.80)',
      },
    },
  },
  plugins: [],
};
