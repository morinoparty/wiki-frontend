import Link from "next/link";
import { sva } from "styled-system/css";

export const mdxStyles = sva({
  slots: [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
    "code",
    "pre",
    "img",
    "hr",
    "table",
    "thead",
    "tr",
    "th",
    "td",
  ],
  base: {
    p: {
      textStyle: "body",
      color: "leaf.700",
      lineHeight: "1.85",
      my: "24px",
      _first: { mt: "0" },
    },
    h1: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "leaf.700",
      textStyle: "heading1",
      mt: "56px",
      mb: "32px",
    },
    h2: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "leaf.700",
      textStyle: "heading2",
      mt: "56px",
      mb: "32px",
    },
    h3: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "leaf.700",
      textStyle: "body",
      mt: "48px",
      mb: "12px",
    },
    h4: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "leaf.700",
      textStyle: "heading4",
      mt: "24px",
      mb: "10px",
    },
    h5: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "leaf.700",
      textStyle: "heading5",
      mt: "18px",
      mb: "8px",
    },
    h6: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "leaf.700",
      textStyle: "heading6",
      mt: "16px",
      mb: "6px",
    },
    ul: {
      pl: "24px",
      my: "16px",
      listStyle: "disc inside",
      textStyle: "body",
    },
    ol: {
      pl: "24px",
      my: "16px",
      listStyle: "decimal inside",
      textStyle: "body",
    },
    li: {
      mb: "8px",
      textStyle: "body",
    },
    a: {
      color: "blue.600",
      textDecoration: "underline",
      textStyle: "body",
      wordBreak: "break-all",
      _hover: { color: "blue.800" },
    },
    blockquote: {
      borderLeft: "4px solid #A3C9A8",
      pl: "16px",
      color: "gray.700",
      fontStyle: "italic",
      my: "16px",
      textStyle: "body",
    },
    code: {
      background: "white",
      color: "gray.800",
      px: "4px",
      py: "2px",
      borderRadius: "4px",
      fontSize: "0.95em",
      textStyle: "body",
    },
    pre: {
      background: "white",
      color: "gray.800",
      px: "16px",
      py: "12px",
      borderRadius: "8px",
      overflowX: "auto",
      my: "16px",
      textStyle: "body",
    },
    img: {
      maxWidth: "100%",
      borderRadius: "8px",
      margin: "16px 0",
    },
    hr: {
      border: "none",
      borderTop: "1px solid #E2E8F0",
      my: "32px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      my: "24px",
      textStyle: "body",
    },
    thead: {
      background: "leaf.600/5",
    },
    tr: {
      borderBottom: "1px solid #E2E8F0",
    },
    th: {
      fontWeight: "bold",
      textAlign: "left",
      px: "12px",
      py: "8px",
      background: "leaf.600/5",
      textStyle: "body",
    },
    td: {
      px: "12px",
      py: "8px",
      textStyle: "body",
    },
  },
});

export const components = {
  p: (props: React.ComponentProps<"p">) => (
    <p className={mdxStyles().p} {...props} />
  ),
  h1: (props: React.ComponentProps<"h1">) => (
    <h1 className={mdxStyles().h1} {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2 className={mdxStyles().h2} {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 className={mdxStyles().h3} {...props} />
  ),
  h4: (props: React.ComponentProps<"h4">) => (
    <h4 className={mdxStyles().h4} {...props} />
  ),
  h5: (props: React.ComponentProps<"h5">) => (
    <h5 className={mdxStyles().h5} {...props} />
  ),
  h6: (props: React.ComponentProps<"h6">) => (
    <h6 className={mdxStyles().h6} {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className={mdxStyles().ul} {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className={mdxStyles().ol} {...props} />
  ),
  li: (props: React.ComponentProps<"li">) => (
    <li className={mdxStyles().li} {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => {
    const { href = "#", ...rest } = props;
    return <Link href={href} className={mdxStyles().a} {...rest} />;
  },
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote className={mdxStyles().blockquote} {...props} />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code className={mdxStyles().code} {...props} />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre className={mdxStyles().pre} {...props} />
  ),
  img: (props: React.ComponentProps<"img">) => {
    const { src = "", alt = "", ...rest } = props;
    if (typeof src !== "string") return null;
    const isExternal =
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("//");
    return (
      <img
        className={mdxStyles().img}
        src={
          isExternal ? src : "https://wiki-contentdev.yahiro.workers.dev/" + src
        }
        alt={alt}
        {...rest}
      />
    );
  },
  hr: (props: React.ComponentProps<"hr">) => (
    <hr className={mdxStyles().hr} {...props} />
  ),
  table: (props: React.ComponentProps<"table">) => (
    <table className={mdxStyles().table} {...props} />
  ),
  thead: (props: React.ComponentProps<"thead">) => (
    <thead className={mdxStyles().thead} {...props} />
  ),
  tbody: (props: React.ComponentProps<"tbody">) => <tbody {...props} />, // tbodyは特別なスタイルなし
  tr: (props: React.ComponentProps<"tr">) => (
    <tr className={mdxStyles().tr} {...props} />
  ),
  th: (props: React.ComponentProps<"th">) => (
    <th className={mdxStyles().th} {...props} />
  ),
  td: (props: React.ComponentProps<"td">) => (
    <td className={mdxStyles().td} {...props} />
  ),
};
