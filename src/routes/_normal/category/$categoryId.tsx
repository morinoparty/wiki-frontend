import { NotFound } from "@/components/NotFound";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Tag, TentTree } from "lucide-react";
import { css, sva } from "styled-system/css";
import { PaginationWrapper } from "./-components/PaginationWrapper";
import WikiCard from "@/components/WikiCard";
import { WikiCardGrid } from "@/components/WikiCardGrid";
import { hasPositionOption } from "@/lib/categoryOptions";
import { pageTitle } from "@/lib/pageTitle";
import { fetchCategoryPage } from "@/server/content";
import type { WikiCategory, WikiPost } from "@/types/wiki";

/** `?page=` を 1 以上の整数に正規化する (不正値は 1 ページ目)。 */
function parsePage(value: unknown): number {
  const page =
    typeof value === "number" ? value : parseInt(String(value ?? "1"), 10);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export const Route = createFileRoute("/_normal/category/$categoryId")({
  validateSearch: (search: Record<string, unknown>): { page?: number } =>
    search.page === undefined ? {} : { page: parsePage(search.page) },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: async ({ params: { categoryId }, deps: { page } }) => {
    const result = await fetchCategoryPage({ data: { categoryId, page } });
    if (!result) throw notFound();
    return result;
  },
  // 「<カテゴリ名>の記事一覧 | もりのパーティ公式Wiki もりぱうぃき!」になる
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { category } = loaderData;
    return {
      meta: [
        { title: pageTitle(`${category.title}の記事一覧`) },
        ...(category.body
          ? [{ name: "description", content: category.body }]
          : []),
      ],
    };
  },
  component: CategoryPostsPage,
  // loader の notFound() をこのルートで受け、公開レイアウトの内側に出す
  notFoundComponent: NotFound,
});

const categoryPostsPageStyles = sva({
  slots: ["container", "pagination"],
  base: {
    container: {
      width: "100%",
      minHeight: "100vh",
      display: "grid",
      gridTemplateRows: "48px auto 64px 1fr 128px auto 200px",
      gridTemplateColumns: {
        base: "90px 1fr 90px",
        lgDown: "24px 1fr 24px",
      },
      gridTemplateAreas: {
        base: `
          ". . ."
          ". header ."
          ". . ."
          ". posts ."
          ". . ."
          ". pagination ."
          ". . ."
        `,
      },
      overflow: "hidden",
      maxWidth: "100vw",
    },
    pagination: {
      gridArea: "pagination",
    },
  },
  variants: {
    hasPosition: {
      true: {
        container: {
          gridTemplateRows: "48px auto 48px 500px 72px 1fr 128px auto 200px",
          gridTemplateAreas: {
            base: `
              ". . ."
              ". header ."
              ". . ."
              "map map map"
              ". . ."
              ". posts ."
              ". . ."
              ". pagination ."
              ". . ."
            `,
          },
        },
      },
    },
    isEmpty: {
      true: {
        container: {
          gridTemplateRows: "48px auto 48px 1fr",
          gridTemplateAreas: {
            base: `
              ". . ."
              ". header ."
              ". . ."
              ". posts ."
            `,
          },
        },
      },
    },
  },
});

function CategoryPostsPage() {
  const {
    category,
    posts: pagedPosts,
    page,
    totalPages,
  } = Route.useLoaderData();
  const hasPosition = hasPositionOption(category);

  const classes = categoryPostsPageStyles({
    hasPosition,
    isEmpty: pagedPosts.length === 0,
  });

  return (
    <div className={classes.container}>
      <CategoryHeader {...category} />
      {hasPosition && pagedPosts.length > 0 && (
        <iframe
          src="https://maps.morino.party/?world=minecraft_overworld&x=5140&z=4007"
          className={css({
            width: "100%",
            height: "100%",
            gridArea: "map",
          })}
        />
      )}
      <CategoryPosts posts={pagedPosts} />

      {totalPages > 1 && (
        <div className={classes.pagination}>
          <PaginationWrapper currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}

const CategoryHeader: React.FC<WikiCategory> = ({ title, body }) => {
  return (
    <header
      className={css({
        mx: "auto",
        gap: {
          base: "24px",
          mdDown: "12px 24px",
        },
        display: "grid",
        gridTemplateColumns: {
          base: "32px 1fr 1fr",
          mdDown: "32px 1fr",
        },
        alignItems: "center",
        width: "100%",
        gridArea: "header",
      })}
    >
      <Tag size={32} strokeWidth={1.25} />
      <h1
        className={css({
          fontSize: "32px",
          fontWeight: "bold",
          color: "colorPalette.fg",
          textStyle: "heading1",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        })}
      >
        {title}
      </h1>
      <p
        className={css({
          textStyle: "body",
          color: "colorPalette.fg",
          width: "100%",
          minHeight: "100%",
          alignContent: "center",
          gridColumn: {
            base: "3 / -1",
            mdDown: "2 / 3",
          },
        })}
      >
        {body}
      </p>
    </header>
  );
};

const CategoryPosts: React.FC<{
  posts: WikiPost[];
}> = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return (
      <div
        className={css({
          px: {
            base: "90px",
            lgDown: "24px",
          },
          height: "100%",
          gap: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gridArea: "posts",
        })}
      >
        <TentTree
          size={64}
          strokeWidth={1.25}
          className={css({ color: "colorPalette.fg.subtle" })}
        />
        <p
          className={css({
            textStyle: "body",
            textAlign: "center",
          })}
        >
          まだ記事がありません🍂
        </p>
      </div>
    );
  }
  return (
    <div
      className={css({
        gridArea: "posts",
      })}
    >
      <WikiCardGrid>
        {posts.map((post) => (
          <WikiCard key={post.slug} post={post} />
        ))}
      </WikiCardGrid>
    </div>
  );
};
