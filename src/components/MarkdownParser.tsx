import { unified } from "unified";
import rehypeSanitize from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import { components } from "./MDXRemoteComponents";
import React from "react";
import { jsxDEV } from "react/jsx-dev-runtime";
import { jsxs, jsx } from "react/jsx-runtime";

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
    .use(remarkRehype, { allowDangerousHtml: false, skipHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeReact, rehypeReactOptions)
    .processSync(body);

  return file.result;
}
