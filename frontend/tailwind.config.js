import daisyui from "daisyui";
import { THEME_KEYS, THEMES } from "../theme.config";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: THEME_KEYS,
  },
};
