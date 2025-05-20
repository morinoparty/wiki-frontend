import { definePreset } from "@pandacss/dev";

export default definePreset({
  name: "custom-colors-preset",
  theme: {
    tokens: {
      colors: {
        leaf: {
          50: { value: "#eaf2ef" },
          100: { value: "#cdebdf" },
          200: { value: "#b5deca" },
          300: { value: "#9ccfb4" },
          400: { value: "#7dbd9d" },
          500: { value: "#5ea181" },
          600: { value: "#347e5e" },
          700: { value: "#2d634b" },
          800: { value: "#1f4634" },
          900: { value: "#133323" },
        },
        sea: {
          50: { value: "#e9f2f2" },
          100: { value: "#c9eaed" },
          200: { value: "#acdde1" },
          300: { value: "#88cdd2" },
          400: { value: "#6abcc2" },
          500: { value: "#3b959b" },
          600: { value: "#077d84" },
          700: { value: "#166267" },
          800: { value: "#184c50" },
          900: { value: "#023336" },
        },
        red: {
          50: { value: "#f6eeec" },
          100: { value: "#f2ddd8" },
          200: { value: "#efc4bc" },
          300: { value: "#e7a296" },
          400: { value: "#e28375" },
          500: { value: "#ca6255" },
          600: { value: "#a25449" },
          700: { value: "#7f433a" },
          800: { value: "#62352f" },
          900: { value: "#41221e" },
        },
        yellow: {
          50: { value: "#f3f3e4" },
          100: { value: "#f6f5b6" },
          200: { value: "#e7e487" },
          300: { value: "#ddd755" },
          400: { value: "#c8c233" },
          500: { value: "#9b9602" },
          600: { value: "#757121" },
          700: { value: "#5b5927" },
          800: { value: "#474622" },
          900: { value: "#2f2e0e" },
        },
      },
    },
  },
});
