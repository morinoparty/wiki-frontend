import type { WikiPost, GetAllPostsOptions } from "@/types/wiki";
import { getHagakiClient } from "./hagaki";

/**
 * 配信中の記事一覧 (`/article.json`) を取得する。
 *
 * ネットワークエラー時は空配列を返し、ページ全体が落ちないようにする。
 */
export async function getAllPosts(
  options?: GetAllPostsOptions
): Promise<WikiPost[]> {
  try {
    const posts = await getHagakiClient().posts.list(
      options ?? { sortBy: "updated", order: "desc" }
    );
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);

    // ネットワークエラーの場合、空の配列を返してアプリケーションが動作し続けるようにする
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.warn("Network error detected, returning empty posts array");
      return [];
    }

    throw error;
  }
}
