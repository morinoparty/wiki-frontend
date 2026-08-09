import { SidebarAuthenticatedSection, SidebarLogo } from "./Sidebar";
import { SidebarDrawerShell } from "./SidebarDrawerShell";
import { sva } from "styled-system/css";

// chlorophyll の Drawer は placement が start / end の 2 値のみで、
// Chakra 版が持っていたレスポンシブな placement("mdDown で bottom シート")と
// size は表現できない。モバイルでも左からのスライドに統一する。
const drawerStyles = sva({
  slots: ["content", "container", "logoContainer"],
  base: {
    content: {
      bg: "colorPalette.bg.subtle",
      maxWidth: "320px",
      height: "100vh",
      maxHeight: "100vh",
    },
    container: {
      minHeight: "100vh",
      p: {
        base: "24px",
        lgDown: "38px",
        mdDown: "24px",
      },
      pb: {
        base: "inherit",
        lgDown: "86px",
        mdDown: "21px",
      },
      display: "grid",
      gridTemplateRows: "auto 1fr auto",
      gap: "32px",
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: {
        base: "center",
        lgDown: "start",
      },
    },
  },
});

export const SidebarDrawer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const drawerClasses = drawerStyles();
  return (
    <div>
      <SidebarDrawerShell contentClassName={drawerClasses.content}>
        <div className={drawerClasses.container}>
          <div className={drawerClasses.logoContainer}>
            <SidebarLogo isSidebar />
          </div>

          <div>{children}</div>

          <div>
            <SidebarAuthenticatedSection />
          </div>
        </div>
      </SidebarDrawerShell>
    </div>
  );
};
