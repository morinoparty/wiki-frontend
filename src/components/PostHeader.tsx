import { sva } from "styled-system/css";
import Link from "next/link";
import { Tag } from "lucide-react";

export const postHeaderStyles = sva({
  slots: ["container", "info", "image", "category", "title", "description"],
  base: {
    container: {
      borderBottom: "1px solid",
      borderColor: "leaf.100",
    },
    info: {
      px: "90px",
      maxWidth: "980px",
      mx: "auto",
      pt: "48px",
      pb: "64px",
    },
    image: {
      width: "100%",
      minHeight: "420px",
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
    category: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      textStyle: "body",
      color: "leaf.600",
      mb: "42px",
    },
    title: {
      fontSize: "40px",
      fontWeight: "bold",
      color: "leaf.700",
      textStyle: "heading1",
      mb: "24px",
      width: "100%",
    },
    description: {
      textStyle: "body",
      color: "leaf.600",
      width: "100%",
    },
  },
});

interface PostHeaderProps {
  image?: string;
  category: string;
  title: string;
  description: string;
}

export function PostHeader({
  image,
  category,
  title,
  description,
}: PostHeaderProps) {
  const classes = postHeaderStyles();
  return (
    <header className={classes.container}>
      {image && (
        <div
          className={classes.image}
          style={{ backgroundImage: `url(${image})` }}
        />
      )}
      <div className={classes.info}>
        <p className={classes.category}>
          <Tag width={16} />
          <Link href={`/category/${category}`}>{category}</Link>
        </p>
        <h1 className={classes.title}>{title}</h1>
        <p className={classes.description}>{description}</p>
      </div>
    </header>
  );
}
