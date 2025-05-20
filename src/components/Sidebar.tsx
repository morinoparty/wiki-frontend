import Link from "next/link";
import { css } from "styled-system/css";
import { Home, Tag } from "lucide-react";
import { UserBox } from "./UserBox";
import { SearchBox } from "@/components/SearchBox";
import { NotLoginNote } from "./NotLoginNote";
import { AuthConditional } from "./AuthConditional";
import { getAllCategories } from "@/lib/getAllCategories";

export async function Sidebar() {
  const categories = await getAllCategories();
  return (
    <aside
      className={css({
        pt: "48px",
        pl: "42px",
        pr: "32px",
        pb: "38px",

        position: "sticky",
        top: 0,
        minHeight: "100vh",
        height: "100vh",
        maxHeight: "100vh",

        display: "grid",
        gridTemplateRows: "auto auto 1fr auto",
      })}
    >
      <Link
        href="/"
        className={css({
          display: "flex",
          alignItems: "center",
          mb: "32px",
          pr: "32px",
        })}
      >
        <img
          src="/assets/logo.svg"
          className={css({
            height: "38px",
            width: "auto",
          })}
          alt="もりのパーティWikiのロゴ"
        />
      </Link>

      <SearchBox />

      <nav>
        <ul className={css({ listStyle: "none", pt: "28px" })}>
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

      <div>
        <AuthConditional fallback={<NotLoginNote />}>
          <UserBox />
        </AuthConditional>
      </div>
    </aside>
  );
}

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
