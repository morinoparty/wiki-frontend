import { sva } from "styled-system/css";
import Link from "next/link";
import { Tag } from "lucide-react";
import { getAllCategories } from "@/lib/getAllCategories";

export const postHeaderStyles = sva({
  slots: ["container", "info", "image", "category", "title", "description"],
  base: {
    container: {
      borderBottom: "1px solid",
      borderColor: "leaf.100",
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
      color: "leaf.700",
      textStyle: "heading1",
      mb: {
        base: "24px",
        lgDown: "20px",
      },
      width: "100%",
    },
    description: {
      textStyle: "body",
      color: "leaf.600",
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
        <div
          className={classes.image}
          style={{
            backgroundImage: `url(${image})`,
          }}
        />
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
