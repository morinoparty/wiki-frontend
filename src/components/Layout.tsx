import { Toaster } from "@/components/ui/toaster";
import { sva } from "../../styled-system/css";
import { Footer } from "./Footer";

const layoutStyles = sva({
  slots: ["container", "sidebar", "main", "mainContainer"],
  base: {
    container: {
      display: "grid",
      gridTemplateColumns: {
        base: "300px 1fr",
        lgDown: "89px 1fr",
        mdDown: "1fr",
      },
      gridTemplateRows: "auto 1fr",
      gridTemplateAreas: {
        base: '"sidebar main"',
        lgDown: '"sidebar main"',
        mdDown: '"sidebar" "main"',
      },
      minHeight: { base: "100vh", lgDown: "auto" },
      backgroundColor: "colorPalette.bg.subtle",
      width: "100%",
    },
    sidebar: {
      gridTemplateRows: "auto 1fr",
      gridArea: "sidebar",
      borderRight: "1px solid",
      borderColor: "border.subtle",
      minHeight: { base: "100vh", lgDown: "inherit" },
      display: {
        base: "grid",
      },
    },
    main: {
      display: "grid",
      gridTemplateRows: "auto 1fr",
      gridArea: "main",
      // grid アイテムの既定 (min-width: auto) だと本文の min-content 幅より
      // 小さくなれない。記事中の <Image> は intrinsic width (例: 1920px) で
      // min-content に効き、max-width: 100% は intrinsic sizing では無視される
      // ため、0 にしないと 1fr のカラムがビューポートを超えて横スクロールが出る。
      minWidth: "0",
    },
    mainContainer: {
      minHeight: "100vh",
      minWidth: "0",
    },
  },
});

export default function Layout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = layoutStyles();
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>{sidebar}</div>
      <div className={styles.main}>
        <div className={styles.mainContainer}>
          <Toaster />
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}
