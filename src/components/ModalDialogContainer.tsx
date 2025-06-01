import { sva } from "styled-system/css";

const modalDialogStyles = sva({
  slots: ["root"],
  base: {
    root: {
      background: "#fff",
      display: "grid",
      gridTemplate: `
        ". . ." 36px
        ". title ." auto
        ". . ." 24px
        "main main main" auto
        ". . ." 16px
        ". footer ." auto
        ". . ." 24px
      `,
      width: "560px",
      minWidth: "560px",
      maxWidth: "560px",
      gridTemplateColumns: "38px 1fr 38px",
      borderRadius: "32px",
      overflow: "hidden",
    },
  },
  variants: {
    hasMainPadding: {
      true: {
        root: {
          gridTemplate: `
            ". . ." 36px
            ". title ." auto
            ". . ." 24px
            ". main ." auto
            ". . ." 16px
            ". footer ." auto
            ". . ." 24px
          `,
        },
      },
    },
  },
});

export const ModalDialogContainer: React.FC<{
  children: React.ReactNode;
  hasMainPadding?: boolean;
}> = ({ children, hasMainPadding = false }) => {
  const classes = modalDialogStyles({
    hasMainPadding: hasMainPadding,
  });

  return <div className={classes.root}>{children}</div>;
};
