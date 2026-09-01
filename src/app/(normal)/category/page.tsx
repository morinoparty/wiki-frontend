import type { Metadata } from "next";
import { getAllCategories } from "@/lib/getAllCategories";
import { getAllPosts } from "@/lib/getAllPosts";
import { Tag } from "lucide-react";
import Link from "next/link";
import { css, sva } from "styled-system/css";

export const metadata: Metadata = {
  title: "カテゴリ一覧",
  description:
    "もりのパーティ公式Wiki「もりぱうぃき!」の記事カテゴリ一覧です。",
};

/**
 * カテゴリ一覧。サイドバーの「カテゴリ一覧」の遷移先で、
 * 各カテゴリの説明と記事数を並べる。
 */
const categoryIndexStyles = sva({
  slots: ["container", "header", "title", "grid", "card", "cardTitle", "cardBody", "count"],
  base: {
    container: {
      width: "100%",
      minHeight: "100vh",
      px: {
        base: "90px",
        lgDown: "24px",
      },
      pt: "48px",
      pb: "200px",
    },
    header: {
      display: "grid",
      gridTemplateColumns: "32px 1fr",
      alignItems: "center",
      gap: "24px",
      mb: "48px",
    },
    title: {
      textStyle: "heading1",
      fontSize: "32px",
      fontWeight: "bold",
      color: "colorPalette.fg",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: {
        base: "repeat(3, 1fr)",
        lgDown: "repeat(2, 1fr)",
        mdDown: "1fr",
      },
      gap: "24px",
    },
    card: {
      display: "grid",
      gap: "8px",
      alignContent: "start",
      p: "24px",
      borderRadius: "24px",
      bg: "bg.panel",
      borderWidth: "1px",
      borderColor: "border.subtle",
      transition: "background 0.2s",
      _hover: {
        bg: "colorPalette.surface",
      },
    },
    cardTitle: {
      textStyle: "heading4",
      fontSize: "20px",
      fontWeight: "bold",
      color: "colorPalette.fg",
    },
    cardBody: {
      textStyle: "body",
      fontSize: "14px",
      color: "colorPalette.fg.subtle",
    },
    count: {
      textStyle: "body",
      fontSize: "12px",
      color: "colorPalette.fg.subtle",
    },
  },
});

export default async function Page() {
  const [categories, posts] = await Promise.all([
    getAllCategories(),
    getAllPosts(),
  ]);
  const classes = categoryIndexStyles();

  const countOf = (slug: string) =>
    posts.filter((post) => post.category === slug).length;

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <Tag size={32} strokeWidth={1.25} className={css({ color: "colorPalette.fg" })} />
        <h1 className={classes.title}>カテゴリ一覧</h1>
      </header>

      <div className={classes.grid}>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className={classes.card}
          >
            <span className={classes.cardTitle}>{category.title}</span>
            <span className={classes.cardBody}>{category.body}</span>
            <span className={classes.count}>{countOf(category.slug)} 件</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
