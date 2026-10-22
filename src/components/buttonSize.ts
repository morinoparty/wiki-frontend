import { cva } from "styled-system/css";

/**
 * chlorophyll の Button に重ねる、以前のローカル Button と同じ大きさ。
 *
 * chlorophyll の size (sm 36 / md 40 / lg 44px) は wiki の既存レイアウトより一回り小さいので、
 * 見た目 (色・影・角丸) は chlorophyll に任せつつ、高さ・左右の余白・文字サイズだけを
 * 以前の値に揃える。`<Button className={buttonSize({ size: "md" })}>` のように使う。
 * css() のクラスは recipe より後の層に出力されるので、recipe の size を上書きできる。
 */
export const buttonSize = cva({
  variants: {
    size: {
      sm: {
        px: "24px",
        height: "46px",
        fontSize: "14px",
      },
      md: {
        px: { base: "32px", mdDown: "24px" },
        height: { base: "50px", mdDown: "46px" },
        fontSize: { base: "16px", mdDown: "14px" },
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
});
