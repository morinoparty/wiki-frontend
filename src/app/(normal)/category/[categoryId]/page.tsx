import { PaginationWrapper } from "@/components/PaginationWrapper";
import WikiCard from "@/components/WikiCard";
import { WikiCardGrid } from "@/components/WikiCardGrid";
import { getAllCategories } from "@/lib/getAllCategories";
import { getAllPosts } from "@/lib/getAllPosts";
import { postDate, WikiCategory, WikiPost } from "@/types/wiki";
import { Tag, TentTree } from "lucide-react";
import { notFound } from "next/navigation";
import { useId } from "react";
import { css, sva } from "styled-system/css";

interface PageProps {
  params: Promise<{ categoryId: string }>;
  searchParams?: Promise<{ page: string }>;
}

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

export default async function Page(props: PageProps) {
  const { params, searchParams } = props;
  const { categoryId } = await params;
  const { page: searchParamsPage } = (await searchParams) || {};

  if (!categoryId) return notFound();
  const categories = await getAllCategories();
  const category = categories.find((category) => category.slug === categoryId);
  if (!category) return notFound();
  const hasPosition = category.hasPosition ?? false;

  const posts = await getAllPosts();
  const categoryPosts = posts.filter((post) => post.category === category.slug);
  if (!categoryPosts) return notFound();
  categoryPosts.sort((a, b) => {
    const aDate = new Date(postDate(a));
    const bDate = new Date(postDate(b));
    return bDate.getTime() - aDate.getTime();
  });

  // クエリパラメータからページ番号を取得
  const PAGE_SIZE = 12;
  let page = 1;
  if (searchParams && searchParamsPage) {
    const pageParam = Array.isArray(searchParamsPage)
      ? searchParamsPage[0]
      : searchParamsPage;
    page = parseInt(pageParam || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
  }
  const totalPages = Math.ceil(categoryPosts.length / PAGE_SIZE);
  const pagedPosts = categoryPosts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

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

export async function generateStaticParams() {
  const categories = await getAllCategories();

  return categories.map((category) => ({ categoryId: category.slug }));
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
        {posts.map((post) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const id = useId();
          return <WikiCard key={post.slug + id} post={post} />;
        })}
      </WikiCardGrid>
    </div>
  );
};
