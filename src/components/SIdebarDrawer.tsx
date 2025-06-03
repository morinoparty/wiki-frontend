import { CloseButton, Drawer, IconButton, Portal } from "@chakra-ui/react";
import { Menu } from "lucide-react";
import { SidebarAuthenticatedSection, SidebarLogo } from "./Sidebar";
import { sva } from "styled-system/css";

const drawerStyles = sva({
  slots: ["content", "container", "logoContainer"],
  base: {
    content: {
      bg: "leaf.50",
      maxHeight: { base: undefined, mdDown: "calc(100vh - 128px)" },
      height: {
        base: "100vh",
        mdDown: "fit-content",
      },
      borderRadius: {
        base: "inherit",
        lgDown: "inherit",
        mdDown: "24px 24px 0px 0px",
      },
    },
    container: {
      minHeight: {
        base: "100vh",
        lgDown: "100vh",
        mdDown: "initial",
      },
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
      gridTemplateRows: {
        base: "auto 1fr auto",
        mdDown: "1fr auto",
      },
      gridTemplateColumns: {
        base: "inherit",
      },
      gap: "32px",
    },
    logoContainer: {
      display: "flex",
      alignItems: {
        base: "center",
      },
      justifyContent: {
        base: "center",
        lgDown: "start",
        mdDown: "start",
      },
      order: {
        base: "0",
        lgDown: "0",
        mdDown: "1",
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
      <Drawer.Root
        placement={{
          base: "end",
          lgDown: "start",
          mdDown: "bottom",
        }}
        size={{
          base: "xs",
          lgDown: "xs",
          mdDown: "full",
        }}
      >
        <Drawer.Trigger asChild>
          <IconButton variant="ghost" aria-label="メニュー">
            <Menu />
          </IconButton>
        </Drawer.Trigger>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content className={drawerClasses.content}>
              <div className={drawerClasses.container}>
                <div className={drawerClasses.logoContainer}>
                  <SidebarLogo isSidebar />
                </div>

                <div>{children}</div>

                <div>
                  <SidebarAuthenticatedSection />
                </div>
              </div>

              <Drawer.CloseTrigger
                top={{
                  base: "24px",
                  lgDown: "initial",
                  mdDown: "initial",
                }}
                right={{
                  base: "24px",
                  lgDown: "initial",
                  mdDown: "24px",
                }}
                left={{
                  base: "initial",
                  lgDown: "24px",
                  mdDown: "initial",
                }}
                bottom={{
                  base: "initial",
                  lgDown: "24px",
                  mdDown: "15px",
                }}
                asChild
              >
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </div>
  );
};
