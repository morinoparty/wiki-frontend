import { Table } from "@morinoparty/chlorophyll-react/components";
import { Link } from "@tanstack/react-router";
import { cx, sva } from "styled-system/css";
import {
  ContentImage,
  type HagakiImageProps,
} from "./ContentImage";
import { CONTENT_BASE_URL } from "@/lib/content";

/**
 * 本文中の hagaki `<Image />` に対応するカスタム要素名。
 * remark 側 (MarkdownParser) がこの名前で hast 要素を作り、ここで
 * `hagaki/react` の `<Image>` に繋ぐ。
 */
export const HAGAKI_IMAGE_TAG = "hagaki-image";

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
    "tableWrapper",
    "table",
  ],
  base: {
    p: {
      textStyle: "body",
      color: "colorPalette.fg",
      lineHeight: "1.85",
      my: "24px",
      _first: { mt: "0" },
    },
    h1: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      textStyle: "heading1",
      mt: "56px",
      mb: "32px",
    },
    h2: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      textStyle: "heading2",
      mt: "56px",
      mb: "32px",
    },
    h3: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      textStyle: "body",
      mt: "48px",
      mb: "12px",
    },
    h4: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      textStyle: "heading4",
      mt: "24px",
      mb: "10px",
    },
    h5: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      textStyle: "heading5",
      mt: "18px",
      mb: "8px",
    },
    h6: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "colorPalette.fg",
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
      borderLeft: "4px solid token(colors.colorPalette.border)",
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
      borderTop: "1px solid token(colors.border.subtle)",
      my: "32px",
    },
    // 表の見た目 (枠線・見出し行の地色・罫線・セルの余白) は chlorophyll の Table が持つ。
    // ここでは記事本文としての前後の余白だけを足す。
    // Table.Root は className を <table> に渡すため、余白は外側のラッパーに付ける
    tableWrapper: {
      my: "24px",
    },
    // 本文のセルは記事の地の文と同じ大きさで読ませる (recipe 既定の sm より大きくする)
    table: {
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
    // 記事内のリンクは外部・アンカー・サイト内が混ざる。サイト内のパスだけ
    // クライアント遷移にする (`//host/...` はプロトコル相対の外部リンク)
    if (!/^\/(?!\/)/.test(href)) {
      return <a href={href} className={mdxStyles().a} {...rest} />;
    }
    return <Link to={href} className={mdxStyles().a} {...rest} />;
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
    const { src = "", alt = "", width, height, ...rest } = props;
    if (typeof src !== "string") return null;
    const isExternal =
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("//");

    // Convert width/height to numbers if they're strings, or use default values
    const imageWidth =
      typeof width === "string"
        ? parseInt(width, 10)
        : typeof width === "number"
          ? width
          : 800;
    const imageHeight =
      typeof height === "string"
        ? parseInt(height, 10)
        : typeof height === "number"
          ? height
          : 600;

    return (
      <img
        className={mdxStyles().img}
        src={isExternal ? src : CONTENT_BASE_URL + src}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        loading="lazy"
        {...rest}
      />
    );
  },
  // hagaki の `<Image imageId="…" />` (MarkdownParser が変換したカスタム要素)。
  // articleId と URL 解決は <HagakiImageConfig> が供給する。
  [HAGAKI_IMAGE_TAG]: (props: HagakiImageProps) => (
    <ContentImage {...props} className={mdxStyles().img} />
  ),
  hr: (props: React.ComponentProps<"hr">) => (
    <hr className={mdxStyles().hr} {...props} />
  ),
  // 表は chlorophyll の Table に繋ぐ。各パーツは props をそのまま要素へ渡すので、
  // GFM の列揃え (rehype-react が `style={{ textAlign }}` に変換したもの) や colSpan、children もそのまま効く。
  // thead / tbody が無い表 (生 HTML で書かれた表など) でも、Table.Row は <table> 直下にそのまま描画される
  table: ({ className, ...props }: React.ComponentProps<"table">) => (
    <div className={mdxStyles().tableWrapper}>
      <Table.Root
        {...props}
        className={cx(mdxStyles().table, className)}
      />
    </div>
  ),
  thead: (props: React.ComponentProps<"thead">) => <Table.Header {...props} />,
  tbody: (props: React.ComponentProps<"tbody">) => <Table.Body {...props} />,
  tr: (props: React.ComponentProps<"tr">) => <Table.Row {...props} />,
  th: (props: React.ComponentProps<"th">) => <Table.Head {...props} />,
  td: (props: React.ComponentProps<"td">) => <Table.Cell {...props} />,
};
