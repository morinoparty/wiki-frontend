import { createPreset, stone } from "@morinoparty/chlorophyll-react/preset";
import { defineConfig } from "@pandacss/dev";
import customColorsPreset from "./src/tokens/custom-colors-preset";
import { textStyles } from "./text-styles";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Chlorophyll ships its tokens as --mpc-* custom properties, so the
  // consumer has to use the very same namespace prefix.
  prefix: "mpc",

  // Where to look for your css declarations
  include: [
    "./src/components/**/*.{ts,tsx,js,jsx}",
    "./src/app/**/*.{ts,tsx,js,jsx}",
    // Required: chlorophyll is distributed as raw TS sources and some of its
    // components (e.g. Badge) call `css()` directly instead of going through a
    // recipe, so Panda has to statically analyse the package sources as well.
    "./node_modules/@morinoparty/chlorophyll-react/src/**/*.{ts,tsx}",
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

  presets: [
    "@pandacss/preset-base",
    createPreset({ brandColor: "mori", grayColor: stone, radius: "xl" }),
    // Keep last so the app specific leaf/sea/red/yellow palette and the
    // breakpoint overrides win over the design system defaults.
    customColorsPreset,
  ],

  globalCss: {
    "html, body": {
      backgroundColor: "leaf.50",
    },
  },
});
