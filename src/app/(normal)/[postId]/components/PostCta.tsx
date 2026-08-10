import { sva } from "styled-system/css";

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
import { Cta } from "@/components/Cta";

export function PostCta() {
  const classes = postCta();
  return (
    <div className={classes.root}>
      <Cta />
    </div>
  );
}
