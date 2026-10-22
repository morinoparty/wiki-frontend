import { sva } from "styled-system/css";
import { Cta } from "@/components/Cta";

const postCta = sva({
  slots: ["root"],
  base: {
    root: {
      px: {
        base: "90px",
        lgDown: "24px",
      },
      mb: "90px",
      maxWidth: "980px",
      mx: "auto",
    },
  },
});

export function PostCta() {
  const classes = postCta();
  return (
    <div className={classes.root}>
      <Cta />
    </div>
  );
}
