import { createPreset, stone } from "@morinoparty/chlorophyll-react/preset";
import { defineConfig } from "@pandacss/dev";
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
    "./src/routes/**/*.{ts,tsx,js,jsx}",
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
      // アプリ側のブレークポイント。chlorophyll の既定 (sm: 480px) より
      // sm を広く取っている
      breakpoints: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",

  jsxFramework: "react", // or 'solid' or 'vue'

  presets: [
    "@pandacss/preset-base",
    createPreset({ brandColor: "mori", grayColor: stone, radius: "xl" }),
  ],

  globalCss: {
    "html, body": {
      colorPalette: "mori",
      backgroundColor: "colorPalette.bg",
      color: "colorPalette.fg",
    },
  },
});
