import { css, cx } from "styled-system/css";
import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";

export function Button(props: ButtonProps) {
  return (
    <ChakraButton
      className={cx(
        css({
          textStyle: "button",
          px: "32px",
          height: "50px",
          borderRadius: "16px",
          _hover: {
            bg: "leaf.700",
          },
        }),
        props.className
      )}
      {...props}
    >
      {props.children}
    </ChakraButton>
  );
}
