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
import React from "react";
import { jsxDEV } from "react/jsx-dev-runtime";
import { jsxs, jsx } from "react/jsx-runtime";

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

export function MarkdownParser({ body }: { body: string }) {
  const isDev = process.env.NODE_ENV === "development";
  const rehypeReactOptions: Record<string, unknown> = {
    createElement: React.createElement,
    Fragment: React.Fragment,
    components,
  };
  if (isDev) {
    rehypeReactOptions.development = true;
    rehypeReactOptions.jsxDEV = jsxDEV;
  } else {
    // production環境ではjsxs, jsxを指定
    rehypeReactOptions.jsxs = jsxs;
    rehypeReactOptions.jsx = jsx;
  }
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkHagakiImage)
    .use(remarkRehype, { allowDangerousHtml: false, skipHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeReact, rehypeReactOptions)
    .processSync(body);

  return file.result;
}
