import { Button } from "@morinoparty/chlorophyll-react/components";
import { Link } from "@tanstack/react-router";
import { css, sva } from "styled-system/css";

export const sidebarNavStyles = sva({
  slots: ["item", "link", "categoryList", "categoryItem", "categoryLink"],
  base: {
    item: {},
    link: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      textStyle: "body",
      color: "colorPalette.fg",
      textDecoration: "none",
      padding: "14px 0",
      borderRadius: "8px",
    },
    categoryList: {
      listStyle: "none",
      display: "grid",
      gap: "6px",
      "&:hover li:not(:hover)": {
        opacity: 0.5,
      },
      "& li": {
        transition: "opacity 0.2s ease",
      },
    },
    categoryItem: {},
    categoryLink: {
      display: "flex",
      alignItems: "center",
      textStyle: "body",
      color: "colorPalette.fg",
      textDecoration: "none",
      pl: "40px",
      borderRadius: "8px",
      opacity: 0.7,
    },
  },
});

/**
 * サイドバーのナビ項目。`asButton` を付けると、chlorophyll の Button (primary / lg) で
 * リンクをボタンの見た目にする (「新規作成」などの主導線向け)。
 */
export const SidebarNavListItem: React.FC<{
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  asButton?: boolean;
}> = ({ href, icon, children, asButton }) => {
  const navClasses = sidebarNavStyles();

  if (asButton) {
    return (
      <li className={navClasses.item}>
        {/* 塗り・hover・高さ・角丸は Button のレシピに任せ、幅だけサイドバーいっぱいに広げる */}
        <Button
          asChild
          intent="primary"
          size="lg"
          className={css({ width: "100%" })}
        >
          <Link to={href}>
            {icon}
            {children}
          </Link>
        </Button>
      </li>
    );
  }

  return (
    <li className={navClasses.item}>
      <Link to={href} className={navClasses.link}>
        {icon}
        {children}
      </Link>
    </li>
  );
};

export const SidebarNavListCategory: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const navClasses = sidebarNavStyles();

  return (
    <li className={navClasses.item}>
      <ul className={navClasses.categoryList}>{children}</ul>
    </li>
  );
};

export const SidebarNavListCategoryItem: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => {
  const navClasses = sidebarNavStyles();

  return (
    <li className={navClasses.categoryItem}>
      <Link to={href} className={navClasses.categoryLink}>
        {children}
      </Link>
    </li>
  );
};
