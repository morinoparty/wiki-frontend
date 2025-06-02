import Link from "next/link";
import { sva } from "styled-system/css";
import { Menu, Settings2 } from "lucide-react";
import { UserBox } from "./UserBox";
import { SearchBox } from "@/components/SearchBox";
import { NotLoginNote } from "./NotLoginNote";
import { AuthConditional } from "./AuthConditional";
import { CloseButton, Drawer, IconButton, Portal } from "@chakra-ui/react";
import { SidebarNavListItem } from "./SidebarNavStyles";
import { HideOnPath } from "./HideOnPath";

const sidebarStyles = sva({
  slots: ["root", "logoContainer", "drawerContainer", "contentContainer"],
  base: {
    root: {
      p: {
        base: "48px 32px 24px 42px",
        lgDown: "24px",
        mdDown: "0 24px 0 24px",
      },
      position: {
        base: "sticky",
        mdDown: "fixed",
      },
      top: {
        base: "0",
        mdDown: "initial",
      },
      bottom: {
        base: "initial",
        mdDown: "0",
      },
      zIndex: {
        base: "100",
      },
      width: {
        base: "100%",
        lgDown: "inherit",
        mdDown: "100%",
      },
      minHeight: {
        base: "100vh",
        lgDown: "inherit",
      },
      height: {
        base: "100vh",
        lgDown: "inherit",
        mdDown: "70px",
      },
      maxHeight: {
        base: "100vh",
        lgDown: "inherit",
        mdDown: "70px",
      },
      display: "grid",
      gridTemplateRows: {
        base: "auto 1fr",
        lgDown: "auto",
      },
      gridTemplateColumns: {
        base: "inherit",
        lgDown: "1fr auto",
      },
      bg: "leaf.50",
      borderTopColor: "leaf.200",
      borderTopWidth: {
        base: "none",
        mdDown: "1px",
      },
      "& > a": {
        display: {
          base: "block",
          lgDown: "none",
          mdDown: "flex",
        },
      },
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
      mb: {
        base: "32px",
        lgDown: "0",
      },
      pr: {
        base: "32px",
        lgDown: "0",
      },
    },
    drawerContainer: {
      display: {
        base: "none",
        lgDown: "flex",
      },
      justifyContent: {
        base: "start",
        lgDown: "end",
        mdDown: "center",
      },
      alignItems: "center",
    },
    contentContainer: {
      display: {
        base: "grid",
        lgDown: "none",
      },
      gridTemplateRows: {
        base: "auto 1fr auto",
        mdDown: "1fr auto",
      },
    },
  },
});

const sidebarContentStyles = sva({
  slots: ["searchContainer", "authenticatedSection", "authenticatedList"],
  base: {
    searchContainer: {
      display: {
        base: undefined,
        mdDown: "none",
      },
      pt: {
        base: "32px",
        lgDown: "0",
      },
    },
    authenticatedSection: {
      display: {
        base: undefined,
        mdDown: "none",
      },
    },
    authenticatedList: {
      display: "grid",
      gap: "16px",
      listStyle: "none",
      pt: {
        base: "28px",
        lgDown: "0",
      },
      pb: {
        base: "inherit",
        mdDown: "32px",
      },
    },
  },
});

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
        lgDown: "38px",
        mdDown: "21px",
      },
      display: "grid",
      gridTemplateRows: {
        base: "auto auto 1fr",
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
        lgDown: "end",
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

const logoStyles = sva({
  slots: ["link", "image"],
  base: {
    link: {
      display: "flex",
      alignItems: "center",
    },
    image: {
      height: {
        base: "32px",
        lgDown: "28px",
        mdDown: "22px",
      },
      width: "auto",
    },
  },
});

export const Sidebar: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const sidebarClasses = sidebarStyles();

  return (
    <aside className={sidebarClasses.root}>
      <SidebarLogo />

      <div className={sidebarClasses.drawerContainer}>
        <SidebarDrawer>{children}</SidebarDrawer>
      </div>

      <div className={sidebarClasses.contentContainer}>
        <SidebarSearchBox />
        {children}
        <SidebarAuthenticatedSection />
      </div>
    </aside>
  );
};

const SidebarSearchBox: React.FC = () => {
  const searchBoxClasses = sidebarContentStyles();

  return (
    <div className={searchBoxClasses.searchContainer}>
      <SearchBox />
    </div>
  );
};

const SidebarAuthenticatedSection: React.FC = () => {
  const contentClasses = sidebarContentStyles();

  return (
    <div className={contentClasses.authenticatedSection}>
      <AuthConditional fallback={<NotLoginNote />}>
        <ul className={contentClasses.authenticatedList}>
          <HideOnPath hidePaths={"/dashboard"}>
            <SidebarNavListItem href="/dashboard" icon={<Settings2 />}>
              管理画面
            </SidebarNavListItem>
          </HideOnPath>
          <UserBox />
        </ul>
      </AuthConditional>
    </div>
  );
};

const SidebarDrawer: React.FC<{
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
                  <SidebarLogo />
                </div>

                {children}
              </div>

              <Drawer.CloseTrigger
                top={{
                  base: "24px",
                  lgDown: "24px",
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
                  lgDown: "initial",
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

const SidebarLogo: React.FC = () => {
  const logoClasses = logoStyles();

  return (
    <Link href="/" className={logoClasses.link}>
      <img
        src="/assets/logo.svg"
        className={logoClasses.image}
        alt="もりのパーティWikiのロゴ"
      />
    </Link>
  );
};
