import Link from "next/link";
import { css } from "styled-system/css";
import { Home, Menu, Tag } from "lucide-react";
import { UserBox } from "./UserBox";
import { SearchBox } from "@/components/SearchBox";
import { NotLoginNote } from "./NotLoginNote";
import { AuthConditional } from "./AuthConditional";
import { getAllCategories } from "@/lib/getAllCategories";
import { CloseButton, Drawer, IconButton, Portal } from "@chakra-ui/react";

export async function Sidebar() {
  return (
    <aside
      className={css({
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
      })}
    >
      <SidebarLogo />

      <div
        className={css({
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
        })}
      >
        <SidebarDrawer />
      </div>

      <div
        className={css({
          display: {
            base: "grid",
            lgDown: "none",
          },
          gridTemplateRows: {
            base: "auto 1fr auto",
            mdDown: "1fr auto",
          },
        })}
      >
        <SidebarContent />
      </div>
    </aside>
  );
}

const SidebarContent: React.FC = async () => {
  const categories = await getAllCategories();
  return (
    <>
      <div
        className={css({
          display: {
            base: undefined,
            mdDown: "none",
          },
        })}
      >
        <SearchBox />
      </div>

      <nav>
        <ul
          className={css({
            listStyle: "none",
            pt: {
              base: "28px",
              lgDown: "0",
            },
            pb: {
              base: "inherit",

              mdDown: "32px",
            },
          })}
        >
          <NavListItem href="/" icon={<Home />}>
            トップページ
          </NavListItem>
          <NavListItem href="/category" icon={<Tag />}>
            カテゴリ一覧
          </NavListItem>
          <NavListCategory>
            {categories.map((category) => (
              <NavListCategoryItem
                key={category.slug}
                href={`/category/${category.slug}`}
              >
                {category.title}
              </NavListCategoryItem>
            ))}
          </NavListCategory>
        </ul>
      </nav>

      <div
        className={css({
          display: {
            base: undefined,
            mdDown: "none",
          },
        })}
      >
        <AuthConditional fallback={<NotLoginNote />}>
          <UserBox />
        </AuthConditional>
      </div>
    </>
  );
};

const SidebarDrawer: React.FC = () => {
  return (
    <>
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
              <Drawer.Content
                className={css({
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
                })}
              >
                <div
                  className={css({
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
                  })}
                >
                  <div
                    className={css({
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
                    })}
                  >
                    <SidebarLogo />
                  </div>

                  <SidebarContent />
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
    </>
  );
};

const SidebarLogo: React.FC = () => {
  return (
    <Link
      href="/"
      className={css({
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
      })}
    >
      <img
        src="/assets/logo.svg"
        className={css({
          height: {
            base: "38px",
            lgDown: "28px",
            mdDown: "22px",
          },
          width: "auto",
        })}
        alt="もりのパーティWikiのロゴ"
      />
    </Link>
  );
};

const NavListItem: React.FC<{
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ href, icon, children }) => {
  return (
    <li className={css({})}>
      <Link
        href={href}
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "16px",
          textStyle: "body",
          color: "leaf.600",
          textDecoration: "none",
          padding: "14px 0",
          borderRadius: "8px",
        })}
      >
        {icon}
        {children}
      </Link>
    </li>
  );
};

const NavListCategory: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <li className={css({})}>
      <ul
        className={css({
          listStyle: "none",
          display: "grid",
          gap: "6px",
        })}
      >
        {children}
      </ul>
    </li>
  );
};

const NavListCategoryItem: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => {
  return (
    <li className={css({})}>
      <Link
        href={href}
        className={css({
          display: "flex",
          alignItems: "center",
          textStyle: "body",
          color: "leaf.600",
          textDecoration: "none",
          pl: "40px",
          borderRadius: "8px",
          opacity: 0.7,
        })}
      >
        {children}
      </Link>
    </li>
  );
};
