import { sva } from "styled-system/css";
import { ContentImageConfig } from "./ContentImageConfig";
import { MarkdownParser } from "./MarkdownParser";

const postBody = sva({
  slots: ["root"],
  base: {
    root: {
      pt: "48px",
      pb: "240px",
      px: {
        base: "90px",
        lgDown: "24px",
      },
      maxWidth: "980px",
      mx: "auto",
    },
  },
});

interface PostBodyProps {
  body: string;
  /** 記事の uuid。本文中の `<Image imageId="…" />` の URL 解決に使う。 */
  articleId: string;
}

export async function PostBody({ body, articleId }: PostBodyProps) {
  const classes = postBody();

  return (
    <main className={classes.root}>
      <ContentImageConfig articleId={articleId}>
        <MarkdownParser body={body} />
      </ContentImageConfig>
    </main>
  );
}
