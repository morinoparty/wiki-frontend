import { ark, type HTMLArkProps } from "@ark-ui/react/factory";
import { cva, cx } from "styled-system/css";

// Chakra の IconButton(variant="ghost") 相当を Ark + Panda で置き換えたもの。
// 単発のアイコンボタンしか使っていないため chlorophyll には持ち込まず、
// アプリ側のローカル部品として leaf パレットに合わせて定義する。
const iconButtonStyles = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    bg: "transparent",
    border: "none",
    color: "colorPalette.fg",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    _hover: {
      bg: "colorPalette.surface",
    },
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    "& :where(svg)": {
      width: "20px",
      height: "20px",
    },
  },
  variants: {
    size: {
      sm: {
        width: "32px",
        height: "32px",
        "& :where(svg)": {
          width: "16px",
          height: "16px",
        },
      },
      md: {
        width: "40px",
        height: "40px",
      },
    },
    shape: {
      square: {
        borderRadius: "12px",
      },
      circle: {
        borderRadius: "9999px",
      },
    },
  },
  defaultVariants: {
    size: "md",
    shape: "square",
  },
});

export interface IconButtonProps extends Omit<HTMLArkProps<"button">, "size"> {
  size?: "sm" | "md";
  shape?: "square" | "circle";
}

export const IconButton = ({
  size,
  shape,
  className,
  ...props
}: IconButtonProps) => {
  return (
    <ark.button
      type="button"
      {...props}
      className={cx(iconButtonStyles({ size, shape }), className)}
    />
  );
};

IconButton.displayName = "IconButton";
