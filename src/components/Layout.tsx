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
        lgDown: "1fr",
      },
      gridTemplateAreas: {
        base: '"sidebar main"',
        lgDown: '"main"',
      },
      minHeight: "100vh",
      backgroundColor: "leaf.50",
      width: "100%",
    },
    sidebar: {
      gridTemplateRows: "auto 1fr",
      gridArea: "sidebar",
      borderRight: "1px solid",
      borderColor: "leaf.200",
      minHeight: "100vh",
      display: {
        base: "grid",
        lgDown: "none",
      },
    },
    main: {
      display: "grid",
      gridTemplateRows: "auto 1fr",
      gridArea: "main",
    },
    mainContainer: {
      minHeight: "100vh",
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
