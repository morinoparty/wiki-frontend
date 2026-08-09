import { sva } from "styled-system/css";
import Link from "next/link";
import { Tag } from "lucide-react";
import { getAllCategories } from "@/lib/getAllCategories";

export const postHeaderStyles = sva({
  slots: ["container", "info", "image", "category", "title", "description"],
  base: {
    container: {
      borderBottom: "1px solid",
      borderColor: "border.subtle",
    },
    info: {
      px: {
        base: "90px",
        lgDown: "24px",
      },
      maxWidth: "980px",
      mx: "auto",
      pt: {
        base: "48px",
        lgDown: "32px",
      },
      pb: {
        base: "64px",
        lgDown: "48px",
      },
    },
    image: {
      position: "relative",
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
      color: "colorPalette.fg",
      mb: {
        base: "42px",
        lgDown: "16px",
      },
    },
    title: {
      fontSize: {
        base: "40px",
        lgDown: "32px",
      },
      fontWeight: "bold",
      color: "colorPalette.fg",
      textStyle: "heading1",
      mb: {
        base: "24px",
        lgDown: "20px",
      },
      width: "100%",
    },
    description: {
      textStyle: "body",
      color: "colorPalette.fg",
      fontSize: {
        base: "18px",
        lgDown: "14px",
      },
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

export async function PostHeader({
  image,
  category,
  title,
  description,
}: PostHeaderProps) {
  const classes = postHeaderStyles();
  const allCategories = await getAllCategories();
  const categoryData = allCategories.find((cat) => cat.slug === category);

  return (
    <header className={classes.container}>
      {image && (
        <div className={classes.image}>
          <img
            src={image}
            alt={title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}
      <div className={classes.info}>
        <p className={classes.category}>
          <Tag width={16} />
          <Link href={`/category/${categoryData?.slug}`}>
            {categoryData?.title}
          </Link>
        </p>
        <h1 className={classes.title}>{title}</h1>
        <p className={classes.description}>{description}</p>
      </div>
    </header>
  );
}
