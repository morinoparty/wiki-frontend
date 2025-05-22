import { css, cx } from "styled-system/css";
import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";

export function Button(props: ButtonProps) {
  return (
    <ChakraButton
      {...props}
      className={cx(
        css({
          textStyle: "button",
          px: {
            base: "32px",
            mdDown: "24px",
          },
          fontSize: {
            base: "16px",
            mdDown: "14px",
          },
          height: {
            base: "50px",
            mdDown: "46px",
          },
          borderRadius: "16px",
          _hover: {
            bg: "leaf.700",
          },
        }),
        props.className
      )}
    >
      {props.children}
    </ChakraButton>
  );
}
