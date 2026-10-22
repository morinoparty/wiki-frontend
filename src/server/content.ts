import { createServerFn } from "@tanstack/react-start";
import { getAllCategories } from "@/lib/getAllCategories";
import { getAllPosts } from "@/lib/getAllPosts";
import { postDate, type GetAllPostsOptions } from "@/types/wiki";

/** 配信中の記事一覧 (`article.json`)。 */
export const fetchAllPosts = createServerFn({ method: "GET" })
  .validator((options?: GetAllPostsOptions) => options)
  .handler(({ data }) => getAllPosts(data));

/** カテゴリ一覧。 */
export const fetchCategories = createServerFn({ method: "GET" }).handler(() =>
  getAllCategories()
);

/** カテゴリ一覧ページ用。各カテゴリと、そのカテゴリの記事数。 */
export const fetchCategoryIndex = createServerFn({ method: "GET" }).handler(
  async () => {
    const [categories, posts] = await Promise.all([
      getAllCategories(),
      getAllPosts(),
    ]);
    return categories.map((category) => ({
      category,
      count: posts.filter((post) => post.category === category.slug).length,
    }));
  }
);

/** 1 ページに並べる記事数 (カテゴリ別の記事一覧)。 */
export const CATEGORY_PAGE_SIZE = 12;

/**
 * カテゴリ別の記事一覧の 1 ページ分。新しい順に並べて切り出して返す。
 * カテゴリが存在しなければ null (呼び出し側の loader で notFound にする)。
 */
export const fetchCategoryPage = createServerFn({ method: "GET" })
  .validator((input: { categoryId: string; page: number }) => input)
  .handler(async ({ data: { categoryId, page } }) => {
    const [categories, posts] = await Promise.all([
      getAllCategories(),
      getAllPosts(),
    ]);
    const category = categories.find((c) => c.slug === categoryId);
    if (!category) return null;

    const categoryPosts = posts
      .filter((post) => post.category === category.slug)
      .sort(
        (a, b) =>
          new Date(postDate(b)).getTime() - new Date(postDate(a)).getTime()
      );
    const totalPages = Math.ceil(categoryPosts.length / CATEGORY_PAGE_SIZE);
    const pagedPosts = categoryPosts.slice(
      (page - 1) * CATEGORY_PAGE_SIZE,
      page * CATEGORY_PAGE_SIZE
    );
    return { category, posts: pagedPosts, page, totalPages };
  });
