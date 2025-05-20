import { sva } from "styled-system/css";
import { MarkdownParser } from "./MarkdownParser";

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
      <MarkdownParser body={body} />
    </main>
  );
}
