import { createServerFn } from "@tanstack/react-start";
import { getAllCategories } from "@/lib/getAllCategories";
import { getAllPosts } from "@/lib/getAllPosts";
import type { GetAllPostsOptions } from "@/types/wiki";

/** 配信中の記事一覧 (`article.json`)。 */
export const fetchAllPosts = createServerFn({ method: "GET" })
  .validator((options?: GetAllPostsOptions) => options)
  .handler(({ data }) => getAllPosts(data));

/** カテゴリ一覧。 */
export const fetchCategories = createServerFn({ method: "GET" }).handler(() =>
  getAllCategories()
);
