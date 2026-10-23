import { unified } from "unified";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkGfm from "remark-gfm";
import rehypeReact from "rehype-react";
import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";
import { components, HAGAKI_IMAGE_TAG } from "./MDXRemoteComponents";
import { useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

/**
 * 本文中の `<Image imageId="…" blurHash64="…" width="…" height="…" alt="…" />`
 * (hagaki のコンテンツフォーマット) を、レンダリング用のカスタム要素に変換する。
 *
 * hagaki 自身はレンダリングを持たないので、MDX の JSX をそのまま評価せず、
 * 正規形の属性だけを取り出して `<hagaki-image>` 要素にマップする。
 * `MDXRemoteComponents` がこの要素を `hagaki/react` の `<Image>` に繋ぐ。
 */
const IMAGE_TAG = /^<Image\s+([^>]*?)\/?>$/;
const ATTR = /([A-Za-z0-9_-]+)="([^"]*)"/g;

interface HtmlNode extends Node {
  type: "html";
  value: string;
}

function remarkHagakiImage() {
  return (tree: Node) => {
    visit(tree, "html", (node: HtmlNode, index: number | undefined, parent: Parent | undefined) => {
      const match = IMAGE_TAG.exec(node.value.trim());
      if (!match || !parent || index === undefined) return;

      const attrs: Record<string, string> = {};
      for (const attr of match[1].matchAll(ATTR)) {
        attrs[attr[1]] = attr[2];
      }
      if (!attrs.imageId) return;

      parent.children[index] = {
        type: "hagakiImage",
        data: {
          hName: HAGAKI_IMAGE_TAG,
          hProperties: {
            imageId: attrs.imageId,
            blurHash64: attrs.blurHash64 ?? "",
            width: attrs.width ?? "",
            height: attrs.height ?? "",
            alt: attrs.alt ?? "",
          },
        },
      } as unknown as Node;
    });
  };
}

// sanitize は既定で未知の要素・属性を落とすため、`<hagaki-image>` を明示的に許可する。
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), HAGAKI_IMAGE_TAG],
  attributes: {
    ...defaultSchema.attributes,
    [HAGAKI_IMAGE_TAG]: ["imageId", "blurHash64", "width", "height", "alt"],
  },
};

/**
 * リンクの中にある画像に付ける印 (hast のプロパティ名)。
 * React には `IN_LINK_ATTRIBUTE` (`data-in-link`) として渡る。
 */
const IN_LINK_PROPERTY = "dataInLink";

interface HastElementLike extends Node {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children?: Node[];
}

/**
 * `<a>` の中にある画像 (`<img>` と `<hagaki-image>`) に印を付ける。
 *
 * 画像はクリックで拡大する `<button>` に包まれるが、リンクの中でそうすると
 * interactive content の入れ子になり、クリックがリンクではなくボタンに取られる。
 * リンク付き画像 (バッジなど) はリンクとして動かしたいので、印の付いた画像は拡大対象から外す。
 * sanitize の後に走らせるので、この属性は本文から書き込めない。
 */
function rehypeMarkImagesInLink() {
  const walk = (node: Node, inLink: boolean) => {
    const element = node as HastElementLike;
    const isElement = element.type === "element";
    if (
      isElement &&
      inLink &&
      (element.tagName === "img" || element.tagName === HAGAKI_IMAGE_TAG)
    ) {
      element.properties = { ...element.properties, [IN_LINK_PROPERTY]: true };
    }
    const nextInLink = inLink || (isElement && element.tagName === "a");
    for (const child of (node as Parent).children ?? []) {
      walk(child, nextInLink);
    }
  };
  return (tree: Node) => walk(tree, false);
}

// SSR とクライアント遷移の両方で同じ処理系を使う。jsx-runtime の jsx / jsxs は
// 開発ビルドでもそのまま動くので、jsxDEV への切り替えはしない
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkHagakiImage)
  .use(remarkRehype, { allowDangerousHtml: false, skipHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, schema)
  .use(rehypeMarkImagesInLink)
  .use(rehypeReact, { Fragment, jsx, jsxs, components });

/**
 * 記事本文 (markdown) を React 要素にする。サーバー (SSR) でもブラウザ
 * (クライアント遷移) でも動く。本文が変わらない限り再パースしない。
 */
export function MarkdownParser({ body }: { body: string }) {
  return useMemo(() => processor.processSync(body).result, [body]);
}
