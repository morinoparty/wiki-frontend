import { PaginationWrapper } from "@/components/PaginationWrapper";
import WikiCard from "@/components/WikiCard";
import { WikiCardGrid } from "@/components/WikiCardGrid";
import { getAllCategories } from "@/lib/getAllCategories";
import { getAllPosts } from "@/lib/getAllPosts";
import { WikiCategory, WikiPost } from "@/types/wiki";
import { Tag } from "lucide-react";
import { notFound } from "next/navigation";
import { useId } from "react";
import { css } from "styled-system/css";

interface PageProps {
  params: Promise<{ categoryId: string }>;
  searchParams?: Promise<{ page: string }>;
}

export default async function Page(props: PageProps) {
  const { params, searchParams } = props;
  const { categoryId } = await params;
  const { page: searchParamsPage } = (await searchParams) || {};

  if (!categoryId) return notFound();
  const categories = await getAllCategories();
  const category = categories.find((category) => category.slug === categoryId);
  if (!category) return notFound();

  const posts = await getAllPosts();
  const categoryPosts = posts.filter(
    (post) => post.category === category.title
  );
  if (!categoryPosts) return notFound();
  categoryPosts.sort((a, b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
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

  return (
    <div>
      <CategoryHeader {...category} />
      <CategoryPosts posts={pagedPosts} />
      <div
        className={css({
          px: {
            base: "90px",
            lgDown: "24px",
          },
          pt: {
            base: "48px",
            lgDown: "24px",
          },
          pb: {
            base: "200px",
            lgDown: "100px",
          },
        })}
      >
        <PaginationWrapper currentPage={page} totalPages={totalPages} />
      </div>
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
        borderBottom: "1px solid",
        borderColor: "leaf.100",
      })}
    >
      <div
        className={css({
          px: {
            base: "90px",
            lgDown: "24px",
          },
          mx: "auto",
          pt: "48px",
          pb: "48px",
        })}
      >
        <h1
          className={css({
            fontSize: "32px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading1",
            mb: "16px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          })}
        >
          <span>
            <Tag size={24} />
          </span>
          {title}
        </h1>
        <p
          className={css({
            textStyle: "body",
            color: "leaf.600",
            width: "100%",
          })}
        >
          {body}
        </p>
      </div>
    </header>
  );
};

const CategoryPosts: React.FC<{
  posts: WikiPost[];
}> = ({ posts }) => {
  return (
    <div
      className={css({
        px: {
          base: "90px",
          lgDown: "24px",
        },
        pt: "48px",
        pb: "64px",
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
