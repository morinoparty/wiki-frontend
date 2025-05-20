import { sva } from "styled-system/css";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { Suspense } from "react";
import { components } from "@/components/MDXRemoteComponents";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

const postBody = sva({
  slots: ["root"],
  base: {
    root: {
      pt: "48px",
      pb: "240px",
      px: "90px",
      maxWidth: "980px",
      mx: "auto",
    },
  },
});

interface PostBodyProps {
  body: string;
}

export async function PostBody({ body }: PostBodyProps) {
  const classes = postBody();

  return (
    <main className={classes.root}>
      <Suspense fallback={<div>Loading...</div>}>
        <MDXRemote
          source={body}
          components={components}
          options={{
            mdxOptions: {
              remarkPlugins: [
                remarkParse,
                [remarkRehype, { allowDangerousHtml: false, skipHtml: true }],
              ],
              rehypePlugins: [rehypeRaw, rehypeStringify, rehypeSanitize],
              format: "md",
            },
          }}
        />
      </Suspense>
    </main>
  );
}
