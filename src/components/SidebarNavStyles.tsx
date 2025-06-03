import Link from "next/link";
import { sva } from "styled-system/css";

export const sidebarNavStyles = sva({
  slots: ["item", "link", "categoryList", "categoryItem", "categoryLink"],
  base: {
    item: {
      position: "relative",
    },
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
  variants: {
    asButton: {
      true: {
        item: {
          _before: {
            content: '""',
            position: "absolute",
            left: "-8px",
            top: "0",
            width: "calc(100% + 16px)",
            height: "100%",
            bgColor: "leaf.600",
            zIndex: "-1",
            borderRadius: "16px",
            transition: "background-color 0.2s ease",
          },
          _hover: {
            _before: {
              bgColor: "leaf.700",
            },
          },
        },
        link: {
          color: "white",
          padding: "14px 28px 14px 12px",
          justifyContent: "center",
        },
      },
    },
  },
});

export const SidebarNavListItem: React.FC<{
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  asButton?: boolean;
}> = ({ href, icon, children, asButton }) => {
  const navClasses = sidebarNavStyles({
    asButton: asButton,
  });

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
