import { ark, type HTMLArkProps } from "@ark-ui/react/factory";
import { cva, cx } from "styled-system/css";

// chlorophyll の Button recipe ではなく、この cva をそのまま使い続ける。
// chlorophyll の intent="primary" は ::after で内側の影(inset.raised)を描くため、
// leaf 系のフラットな見た目を持つこの定義に重ねると余計な立体感が透けてしまう。
// レイアウト/配色は据え置き、Chakra への依存だけを ark.button に差し替える。
const buttonStyles = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "16px",
    textStyle: "button",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    _hover: {
      bg: "colorPalette.solid.emphasized",
    },
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  variants: {
    size: {
      sm: {
        px: "24px",
        height: "46px",
        fontSize: "14px",
      },
      md: {
        px: {
          base: "32px",
          mdDown: "24px",
        },
        height: {
          base: "50px",
          mdDown: "46px",
        },
        fontSize: {
          base: "16px",
          mdDown: "14px",
        },
      },
      lg: {
        px: "40px",
        height: "56px",
        fontSize: "18px",
      },
    },
    variant: {
      solid: {
        bg: "colorPalette.solid",
        color: "white",
        _hover: {
          bg: "colorPalette.solid.emphasized",
        },
      },
      outline: {
        bg: "transparent",
        color: "colorPalette.fg",
        borderWidth: "2px",
        borderColor: "colorPalette.border",
        _hover: {
          bg: "colorPalette.solid",
          color: "white",
        },
      },
      ghost: {
        bg: "transparent",
        color: "colorPalette.fg",
        _hover: {
          bg: "colorPalette.surface",
        },
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "solid",
  },
});

export interface CustomButtonProps extends Omit<HTMLArkProps<"button">, "size"> {
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline" | "ghost";
}

export const Button = ({
  size,
  variant,
  className,
  ...props
}: CustomButtonProps) => {
  return (
    <ark.button
      {...props}
      className={cx(buttonStyles({ size, variant }), className)}
    />
  );
};

Button.displayName = "Button";
