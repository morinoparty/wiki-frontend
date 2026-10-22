import { Card } from "@morinoparty/chlorophyll-react/components";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { css, sva } from "styled-system/css";
import { pageTitle } from "@/lib/pageTitle";
import { fetchCategoryIndex } from "@/server/content";

export const Route = createFileRoute("/_normal/category/")({
  loader: () => fetchCategoryIndex(),
  head: () => ({
    meta: [
      { title: pageTitle("カテゴリ一覧") },
      {
        name: "description",
        content:
          "もりのパーティ公式Wiki「もりぱうぃき!」の記事カテゴリ一覧です。",
      },
    ],
  }),
  component: CategoryIndex,
});

/**
 * カテゴリ一覧。サイドバーの「カテゴリ一覧」の遷移先で、
 * 各カテゴリの説明と記事数を並べる。
 */
const categoryIndexStyles = sva({
  slots: ["container", "header", "title", "grid", "count"],
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
    count: {
      textStyle: "body",
      fontSize: "12px",
      color: "colorPalette.fg.subtle",
    },
  },
});

function CategoryIndex() {
  const categories = Route.useLoaderData();
  const classes = categoryIndexStyles();

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <Tag size={32} strokeWidth={1.25} className={css({ color: "colorPalette.fg" })} />
        <h1 className={classes.title}>カテゴリ一覧</h1>
      </header>

      <div className={classes.grid}>
        {categories.map(({ category, count }) => (
          // 枠線・hover・フォーカスリングは Card の interactive が持つ。
          // asChild で TanStack Router の Link をそのまま描画し、preload とクライアント遷移を保つ
          <Card.Root
            key={category.slug}
            asChild
            interactive
            variant="outline"
            size="lg"
          >
            <Link to="/category/$categoryId" params={{ categoryId: category.slug }}>
              <Card.Body>
                {/* リンク内の見出し的なテキストは従来どおり span のまま */}
                <Card.Title asChild>
                  <span>{category.title}</span>
                </Card.Title>
                <Card.Description asChild>
                  <span>{category.body}</span>
                </Card.Description>
                <span className={classes.count}>{count} 件</span>
              </Card.Body>
            </Link>
          </Card.Root>
        ))}
      </div>
    </div>
  );
}
