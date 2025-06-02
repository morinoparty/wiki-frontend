"use server";

import { ApiResult } from "./types";
import { WikiPost, WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";

/**
 * すべての記事を取得（権限フィルタリング付き）
 */
export async function getAllPosts(): Promise<ApiResult<WikiPost[]>> {
  try {
    const session = await AuthService.getCurrentSession();
    const userId = session?.user?.id;

    // GitHubから全記事を取得
    const allPosts = await GitHubService.getAllPosts();
    if (!allPosts.success) {
      return { success: false, error: allPosts.error };
    }

    // 権限フィルタリング（ユーザーがいない場合はpublicのみ）
    let filteredPosts = allPosts.data || [];
    if (userId) {
      filteredPosts = await PermissionService.filterReadablePosts(
        userId,
        filteredPosts
      );
    } else {
      // 未認証ユーザーはpublicのみ
      filteredPosts = filteredPosts.filter(
        (post) => post.visibility === "public"
      );
    }

    return {
      success: true,
      data: filteredPosts,
    };
  } catch (error) {
    console.error("Error getting all posts:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の取得に失敗しました",
    };
  }
}

/**
 * 記事を取得（権限チェック付き）
 */
export async function getPost(
  slug: string
): Promise<ApiResult<WikiPostDetail>> {
  try {
    const session = await AuthService.getCurrentSession();
    const userId = session?.user?.id;

    // GitHubから記事を取得
    const post = await GitHubService.getPost(slug);
    if (!post) {
      return { success: false, error: "記事が見つかりません" };
    }

    // 権限チェック
    if (userId) {
      const hasPermission = await PermissionService.checkPostPermission(
        userId,
        post,
        "read"
      );
      if (!hasPermission && post.visibility !== undefined) {
        return { success: false, error: "この記事を閲覧する権限がありません" };
      }
    } else {
      // 未認証ユーザーはpublicのみ
      if (post.visibility !== "public") {
        return { success: false, error: "この記事を閲覧する権限がありません" };
      }
    }

    return {
      success: true,
      data: post,
    };
  } catch (error) {
    console.error("Error getting post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の取得に失敗しました",
    };
  }
}

/**
 * カテゴリごとの記事を取得
 */
export async function getPostsByCategory(
  category: string
): Promise<ApiResult<WikiPost[]>> {
  try {
    const allPostsResult = await getAllPosts();
    if (!allPostsResult.success) {
      return allPostsResult;
    }

    const categoryPosts =
      allPostsResult.data?.filter((post) => post.category === category) || [];

    return {
      success: true,
      data: categoryPosts,
    };
  } catch (error) {
    console.error("Error getting posts by category:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "カテゴリ記事の取得に失敗しました",
    };
  }
}

/**
 * 記事を検索
 */
export async function searchPosts(
  query: string
): Promise<ApiResult<WikiPost[]>> {
  try {
    const allPostsResult = await getAllPosts();
    if (!allPostsResult.success) {
      return allPostsResult;
    }

    const searchResults =
      allPostsResult.data?.filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.description.toLowerCase().includes(query.toLowerCase()) ||
          post.category.toLowerCase().includes(query.toLowerCase())
      ) || [];

    return {
      success: true,
      data: searchResults,
    };
  } catch (error) {
    console.error("Error searching posts:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の検索に失敗しました",
    };
  }
}

/**
 * ユーザーの記事一覧を取得
 */
export async function getUserPosts(
  userId?: string
): Promise<ApiResult<WikiPost[]>> {
  try {
    const session = await AuthService.getCurrentSession();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return { success: false, error: "ユーザーIDが必要です" };
    }

    const allPostsResult = await getAllPosts();
    if (!allPostsResult.success) {
      return allPostsResult;
    }

    const userPosts =
      allPostsResult.data?.filter(
        (post) =>
          post.createdBy === targetUserId || post.documentOwner === targetUserId
      ) || [];

    return {
      success: true,
      data: userPosts,
    };
  } catch (error) {
    console.error("Error getting user posts:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ユーザー記事の取得に失敗しました",
    };
  }
}

/**
 * ビルド時用の記事スラッグ一覧を取得（認証なし）
 */
export async function getAllPostSlugsForBuild(): Promise<string[]> {
  try {
    const result = await GitHubService.getAllPostsForBuild();
    if (!result.success || !result.data) {
      console.warn("Failed to get posts for build:", result.error);
      return [];
    }
    return result.data.map((item) => item.slug);
  } catch (error) {
    console.warn("Error getting posts for build:", error);
    return [];
  }
}
