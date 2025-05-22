import Link from "next/link";
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
  return (
    <li>
      <Link href={href} className={cx(styles.link, className)}>
        {children}
        {withIcon && <ArrowUpRight size={16} />}
      </Link>
    </li>
  );
}
