import { unified } from "unified";
import rehypeSanitize from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import { components } from "./MDXRemoteComponents";
import React from "react";
import { jsxDEV } from "react/jsx-dev-runtime";

export function MarkdownParser({ body }: { body: string }) {
  const file = unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: false, skipHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeReact, {
      createElement: React.createElement,
      Fragment: React.Fragment,
      components,
      development: true,
      jsxDEV: jsxDEV,
    })
    .processSync(body);

  return file.result;
}
