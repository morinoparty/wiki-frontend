import Link from "next/link";
import { sva } from "styled-system/css";
import { Settings2 } from "lucide-react";
import { UserBox } from "./UserBox";
import { SearchBox } from "@/components/SearchBox";
import { NotLoginNote } from "./NotLoginNote";
import { AuthConditional } from "./AuthConditional";
import { SidebarNavListItem } from "./SidebarNavStyles";
import { HideOnPath } from "./HideOnPath";
import { SidebarDrawer } from "./sidebar-drawer";

const sidebarStyles = sva({
  slots: ["root", "logoContainer", "drawerContainer", "contentContainer"],
  base: {
    root: {
      p: {
        base: "48px 32px 24px 42px",
        lgDown: "24px 16px",
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
        lgDown: "100vh",
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
        lgDown: "auto 1fr auto",
        mdDown: "auto",
      },
      gridTemplateColumns: {
        base: "inherit",
        lgDown: "auto",
        mdDown: "1fr auto",
      },
      borderTopColor: "border.subtle",
      borderTopWidth: {
        base: "none",
        mdDown: "1px",
      },
      alignItems: "center",
      "& > a": {
        display: {
          base: "block",
          lgDown: "block",
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
        lgDown: "center",
        mdDown: "center",
      },
      alignItems: "center",
      gridRow: {
        base: "inherit",
        lgDown: "3 / 4",
        mdDown: "inherit",
      },
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
      height: {
        base: "100%",
      },
      // grid の 1fr 行は既定 (min-height: auto) だと中身より小さくなれない。
      // 0 にしておかないとサイドバー全体が 100vh をはみ出し、メニュー末尾が
      // 未ログイン時のログインカードに隠れる。
      minHeight: "0",
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

const logoStyles = sva({
  slots: ["link", "image", "imageDrawer"],
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
      display: {
        base: "block",
        lgDown: "none",
        mdDown: "block",
      },
    },
    imageDrawer: {
      display: {
        base: "none",
        lgDown: "block",
        mdDown: "none",
      },
      w: "100%",
      aspectRatio: "1 / 1",
    },
  },
  variants: {
    isSidebar: {
      true: {
        image: {
          display: {
            base: "block",
            lgDown: "block",
            mdDown: "block",
          },
        },
        imageDrawer: {
          display: {
            base: "none",
            lgDown: "none",
            mdDown: "none",
          },
        },
      },
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

export const SidebarAuthenticatedSection: React.FC = () => {
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

export const SidebarLogo: React.FC<{
  isSidebar?: boolean;
}> = ({ isSidebar }) => {
  const logoClasses = logoStyles({
    isSidebar: isSidebar ?? false,
  });

  return (
    <Link href="/" className={logoClasses.link}>
      <img
        src="/assets/logo.svg"
        className={logoClasses.image}
        alt="もりのパーティWikiのロゴ"
      />
      <img
        src="/assets/logo-small.svg"
        className={logoClasses.imageDrawer}
        alt="もりのパーティWikiのロゴ"
      />
    </Link>
  );
};
