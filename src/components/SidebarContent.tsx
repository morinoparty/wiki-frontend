import { getAllCategories } from "@/lib/getAllCategories";
import { ChevronLeft, Columns2, Home, SquarePen, Tag } from "lucide-react";
import { css, sva } from "styled-system/css";
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
    nav: {},
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
      <ul className={contentClasses.list}>
        <li
          className={css({
            ml: "-12px",
          })}
        >
          <IconButton variant="ghost" asChild>
            <Link href="/">
              <ChevronLeft />
            </Link>
          </IconButton>
        </li>

        <SidebarNavListItem href="/dashboard" icon={<Columns2 />}>
          ダッシュボード
        </SidebarNavListItem>

        <SidebarNavListItem href="/dashboard/posts/new" icon={<SquarePen />}>
          新規作成
        </SidebarNavListItem>
      </ul>
    </nav>
  );
};
