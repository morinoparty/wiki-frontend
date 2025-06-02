import Link from "next/link";
import { sva } from "styled-system/css";

export const sidebarNavStyles = sva({
  slots: ["item", "link", "categoryList", "categoryItem", "categoryLink"],
  base: {
    item: {},
    link: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      textStyle: "body",
      color: "leaf.600",
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
      color: "leaf.600",
      textDecoration: "none",
      pl: "40px",
      borderRadius: "8px",
      opacity: 0.7,
    },
  },
});

export const SidebarNavListItem: React.FC<{
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ href, icon, children }) => {
  const navClasses = sidebarNavStyles();

  return (
    <li className={navClasses.item}>
      <Link href={href} className={navClasses.link}>
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
      <Link href={href} className={navClasses.categoryLink}>
        {children}
      </Link>
    </li>
  );
};
