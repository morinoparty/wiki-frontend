import { cva, cx } from "styled-system/css";
import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";
import { forwardRef } from "react";

const buttonStyles = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
    textStyle: "button",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
    _hover: {
      bg: "leaf.700",
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
        bg: "leaf.600",
        color: "white",
        _hover: {
          bg: "leaf.700",
        },
      },
      outline: {
        bg: "transparent",
        color: "leaf.600",
        borderWidth: "2px",
        borderColor: "leaf.600",
        _hover: {
          bg: "leaf.600",
          color: "white",
        },
      },
      ghost: {
        bg: "transparent",
        color: "leaf.600",
        _hover: {
          bg: "leaf.100",
        },
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "solid",
  },
});

export interface CustomButtonProps
  extends Omit<ButtonProps, "size" | "variant"> {
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ size, variant, className, ...props }, ref) => {
    return (
      <ChakraButton
        ref={ref}
        {...props}
        className={cx(buttonStyles({ size, variant }), className)}
      >
        {props.children}
      </ChakraButton>
    );
  }
);

Button.displayName = "Button";
