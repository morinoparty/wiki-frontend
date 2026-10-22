import type { WikiCategory } from "@/types/wiki";
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
import { IconButton } from "@/components/IconButton";
import { Link } from "@tanstack/react-router";

const sidebarContentStyles = sva({
  slots: ["nav", "list"],
  base: {
    nav: {
      height: "100%",
      // サイドバーは 100vh 固定。カテゴリが増えて入り切らなくなったとき、
      // grid の 1fr 行が縮めるように min-height を 0 にしてこの中でスクロールさせる
      // (そうしないと未ログイン時のログインカードにメニュー末尾が隠れる)。
      minHeight: "0",
      overflowY: "auto",
      overscrollBehavior: "contain",
      // 「新規作成」ボタン (asButton) は _before で左右に 8px はみ出すが、
      // overflowY: auto を指定すると overflow-x も auto 扱いになるため
      // そのままだと横スクロールバーが出て、左側のはみ出しは切れてしまう。
      // 同じ幅の内側パディングではみ出しを受け止め、負のマージンで見た目の位置を戻す。
      px: "8px",
      mx: "-8px",
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

export const SidebarContentNormal: React.FC<{
  categories: WikiCategory[];
}> = ({ categories }) => {
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

export const SidebarContentDashboard: React.FC = () => {
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
            <IconButton asChild>
              <Link to="/">
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
