import { css } from "styled-system/css";

// 必要に応じてカスタムコンポーネントを定義
export const components = {
  p: (props: React.ComponentProps<"p">) => (
    <p
      className={css({
        textStyle: "body",
        color: "leaf.700",
        lineHeight: "1.85",
        my: "24px",
      })}
      {...props}
    />
  ),
  h1: (props: React.ComponentProps<"h1">) => (
    <h1
      className={css({
        fontSize: "32px",
        fontWeight: "bold",
        color: "leaf.700",
        textStyle: "heading1",
        mt: "56px",
        mb: "32px",
      })}
      {...props}
    />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2
      className={css({
        fontSize: "28px",
        fontWeight: "bold",
        color: "leaf.700",
        textStyle: "heading2",
        mt: "56px",
        mb: "32px",
      })}
      {...props}
    />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3
      className={css({
        fontSize: "24px",
        fontWeight: "bold",
        color: "leaf.700",
        textStyle: "body",
        mt: "48px",
        mb: "12px",
      })}
      {...props}
    />
  ),
  h4: (props: React.ComponentProps<"h4">) => (
    <h4
      className={css({
        fontSize: "20px",
        fontWeight: "bold",
        color: "leaf.700",
        textStyle: "heading4",
        mt: "24px",
        mb: "10px",
      })}
      {...props}
    />
  ),
  h5: (props: React.ComponentProps<"h5">) => (
    <h5
      className={css({
        fontSize: "18px",
        fontWeight: "bold",
        color: "leaf.700",
        textStyle: "heading5",
        mt: "18px",
        mb: "8px",
      })}
      {...props}
    />
  ),
  h6: (props: React.ComponentProps<"h6">) => (
    <h6
      className={css({
        fontSize: "16px",
        fontWeight: "bold",
        color: "leaf.700",
        textStyle: "heading6",
        mt: "16px",
        mb: "6px",
      })}
      {...props}
    />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul
      className={css({
        pl: "24px",
        my: "16px",
        listStyle: "disc inside",
        textStyle: "body",
      })}
      {...props}
    />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol
      className={css({
        pl: "24px",
        my: "16px",
        listStyle: "decimal inside",
        textStyle: "body",
      })}
      {...props}
    />
  ),
  li: (props: React.ComponentProps<"li">) => (
    <li
      className={css({
        mb: "8px",
        textStyle: "body",
      })}
      {...props}
    />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a
      className={css({
        color: "blue.600",
        textDecoration: "underline",
        textStyle: "body",
        _hover: { color: "blue.800" },
      })}
      {...props}
    />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className={css({
        borderLeft: "4px solid #A3C9A8",
        pl: "16px",
        color: "gray.700",
        fontStyle: "italic",
        my: "16px",
        textStyle: "body",
      })}
      {...props}
    />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code
      className={css({
        background: "gray.100",
        color: "gray.800",
        px: "4px",
        py: "2px",
        borderRadius: "4px",
        fontSize: "0.95em",
        textStyle: "body",
      })}
      {...props}
    />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre
      className={css({
        background: "gray.100",
        color: "gray.800",
        px: "16px",
        py: "12px",
        borderRadius: "8px",
        overflowX: "auto",
        my: "16px",
        textStyle: "body",
      })}
      {...props}
    />
  ),
  img: (props: React.ComponentProps<"img">) => {
    const { src = "", alt = "", ...rest } = props;
    if (typeof src !== "string") return null;
    return (
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: "100%",
          borderRadius: "8px",
          margin: "16px 0",
        }}
        {...rest}
      />
    );
  },
  hr: (props: React.ComponentProps<"hr">) => (
    <hr
      className={css({
        border: "none",
        borderTop: "1px solid #E2E8F0",
        my: "32px",
      })}
      {...props}
    />
  ),
  table: (props: React.ComponentProps<"table">) => (
    <table
      className={css({
        width: "100%",
        borderCollapse: "collapse",
        my: "24px",
        textStyle: "body",
      })}
      {...props}
    />
  ),
  thead: (props: React.ComponentProps<"thead">) => (
    <thead
      className={css({
        background: "gray.50",
      })}
      {...props}
    />
  ),
  tbody: (props: React.ComponentProps<"tbody">) => <tbody {...props} />,
  tr: (props: React.ComponentProps<"tr">) => (
    <tr
      className={css({
        borderBottom: "1px solid #E2E8F0",
      })}
      {...props}
    />
  ),
  th: (props: React.ComponentProps<"th">) => (
    <th
      className={css({
        fontWeight: "bold",
        textAlign: "left",
        px: "12px",
        py: "8px",
        background: "gray.100",
        textStyle: "body",
      })}
      {...props}
    />
  ),
  td: (props: React.ComponentProps<"td">) => (
    <td
      className={css({
        px: "12px",
        py: "8px",
        textStyle: "body",
      })}
      {...props}
    />
  ),
};
