import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cx, sva } from "styled-system/css";

const footerLinkItemStyles = sva({
  slots: ["link"],
  base: {
    link: {
      textStyle: "body",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      color: "inherit",
    },
  },
});

interface FooterLinkItemProps {
  href: string;
  children: ReactNode;
  className?: string;
  withIcon?: boolean;
}

export function FooterLinkItem({
  href,
  children,
  className,
  withIcon,
}: FooterLinkItemProps) {
  const styles = footerLinkItemStyles();
  const content = (
    <>
      {children}
      {withIcon && <ArrowUpRight size={16} />}
    </>
  );
  return (
    <li>
      {/^https?:\/\//.test(href) ? (
        <a href={href} className={cx(styles.link, className)}>
          {content}
        </a>
      ) : (
        <Link to={href} className={cx(styles.link, className)}>
          {content}
        </Link>
      )}
    </li>
  );
}
