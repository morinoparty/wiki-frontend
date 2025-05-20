import { defineConfig } from "@pandacss/dev";
import customColorsPreset from "./src/tokens/custom-colors-preset";
import { textStyles } from "./text-styles";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: [
    "./src/components/**/*.{ts,tsx,js,jsx}",
    "./src/app/**/*.{ts,tsx,js,jsx}",
  ],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      textStyles,
    },
  },

  // The output directory for your css system
  outdir: "styled-system",

  jsxFramework: "react", // or 'solid' or 'vue'

  presets: [customColorsPreset],
});
