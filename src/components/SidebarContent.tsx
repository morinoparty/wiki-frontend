import { getAllCategories } from "@/lib/getAllCategories";
import {
  ChevronLeft,
  Columns2,
  File,
  Home,
  SquarePen,
  Tag,
} from "lucide-react";
import { css, cx, sva } from "styled-system/css";
import {
  SidebarNavListItem,
  SidebarNavListCategory,
  SidebarNavListCategoryItem,
} from "./SidebarNavStyles";
import { IconButton } from "@chakra-ui/react";
import Link from "next/link";

const sidebarContentStyles = sva({
  slots: ["nav", "list"],
  base: {
    nav: {
      height: "100%",
    },
    list: {
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

export const SidebarContentNormal: React.FC = async () => {
  const categories = await getAllCategories();
  const contentClasses = sidebarContentStyles();

  return (
    <nav className={contentClasses.nav}>
      <ul className={contentClasses.list}>
        <SidebarNavListItem href="/" icon={<Home />}>
          トップページ
        </SidebarNavListItem>
        <SidebarNavListItem href="/category" icon={<Tag />}>
          カテゴリ一覧
        </SidebarNavListItem>
        <SidebarNavListCategory>
          {categories.map((category) => (
            <SidebarNavListCategoryItem
              key={category.slug}
              href={`/category/${category.slug}`}
            >
              {category.title}
            </SidebarNavListCategoryItem>
          ))}
        </SidebarNavListCategory>
      </ul>
    </nav>
  );
};

export const SidebarContentDashboard: React.FC = async () => {
  const contentClasses = sidebarContentStyles();

  return (
    <nav className={contentClasses.nav}>
      <ul
        className={cx(
          contentClasses.list,
          css({
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          })
        )}
      >
        <div>
          <div
            className={css({
              ml: "-12px",
            })}
          >
            <IconButton variant="ghost" asChild>
              <Link href="/">
                <ChevronLeft />
              </Link>
            </IconButton>
          </div>

          <SidebarNavListItem href="/dashboard" icon={<Columns2 />}>
            ダッシュボード
          </SidebarNavListItem>
          <SidebarNavListItem href="/dashboard/posts" icon={<File />}>
            投稿一覧
          </SidebarNavListItem>
        </div>

        <SidebarNavListItem
          href="/dashboard/posts/new"
          icon={<SquarePen />}
          asButton
        >
          新規作成
        </SidebarNavListItem>
      </ul>
    </nav>
  );
};
