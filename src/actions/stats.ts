"use server";

import { ApiResult } from "./types";
import { AuthService } from "./services/auth-service";
import { getAllPosts } from "./queries";

/**
 * システム統計情報
 */
export type SystemStats = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
  lockedPosts: number;
  categoriesCount: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{
    type: "create" | "update" | "delete" | "lock" | "unlock";
    slug: string;
    title: string;
    user: string;
    date: string;
  }>;
};

/**
 * ユーザー統計情報
 */
export type UserStats = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  lockedPosts: number;
  recentPosts: Array<{
    slug: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
};

/**
 * システム統計を取得
 */
export async function getSystemStats(): Promise<ApiResult<SystemStats>> {
  try {
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 管理者権限チェック
    const isAdmin = await AuthService.isAdmin(session.user.id);
    if (!isAdmin) {
      return { success: false, error: "管理者権限が必要です" };
    }

    // 全記事を取得
    const allPostsResult = await getAllPosts();
    if (!allPostsResult.success) {
      return { success: false, error: allPostsResult.error };
    }

    const posts = allPostsResult.data || [];

    // 統計情報を計算
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === "published").length;
    const draftPosts = posts.filter((p) => p.status === "draft").length;
    const archivedPosts = posts.filter((p) => p.status === "archived").length;
    const lockedPosts = posts.filter((p) => p.isLocked).length;

    // カテゴリ統計
    const categoryCount = new Map<string, number>();
    posts.forEach((post) => {
      const count = categoryCount.get(post.category) || 0;
      categoryCount.set(post.category, count + 1);
    });

    const categoriesCount = categoryCount.size;
    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 最近のアクティビティ（簡易版）
    const recentActivity = posts
      .filter((p) => p.updatedAt)
      .sort(
        (a, b) =>
          new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
      )
      .slice(0, 10)
      .map((post) => ({
        type: "update" as const,
        slug: post.slug,
        title: post.title,
        user: post.lastModifiedBy || "Unknown",
        date: post.updatedAt!,
      }));

    const stats: SystemStats = {
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      lockedPosts,
      categoriesCount,
      topCategories,
      recentActivity,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error getting system stats:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "統計情報の取得に失敗しました",
    };
  }
}

/**
 * ユーザー統計を取得
 */
export async function getUserStats(
  userId?: string
): Promise<ApiResult<UserStats>> {
  try {
    const session = await AuthService.getCurrentSession();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return { success: false, error: "ユーザーIDが必要です" };
    }

    // 他のユーザーの統計を見る場合は管理者権限が必要
    if (userId && userId !== session?.user?.id) {
      const isAdmin = await AuthService.isAdmin(session?.user?.id || "");
      if (!isAdmin) {
        return {
          success: false,
          error: "他のユーザーの統計を見る権限がありません",
        };
      }
    }

    // 全記事を取得してフィルタリング
    const allPostsResult = await getAllPosts();
    if (!allPostsResult.success) {
      return { success: false, error: allPostsResult.error };
    }

    const userPosts = (allPostsResult.data || []).filter(
      (post) =>
        post.createdBy === targetUserId || post.documentOwner === targetUserId
    );

    // ユーザー統計を計算
    const totalPosts = userPosts.length;
    const publishedPosts = userPosts.filter(
      (p) => p.status === "published"
    ).length;
    const draftPosts = userPosts.filter((p) => p.status === "draft").length;
    const lockedPosts = userPosts.filter((p) => p.isLocked).length;

    const recentPosts = userPosts
      .filter((p) => p.updatedAt)
      .sort(
        (a, b) =>
          new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
      )
      .slice(0, 5)
      .map((post) => ({
        slug: post.slug,
        title: post.title,
        status: post.status || "draft",
        updatedAt: post.updatedAt!,
      }));

    const stats: UserStats = {
      totalPosts,
      publishedPosts,
      draftPosts,
      lockedPosts,
      recentPosts,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ユーザー統計の取得に失敗しました",
    };
  }
}

/**
 * システムヘルスチェック
 */
export async function healthCheck(): Promise<
  ApiResult<{
    status: "healthy" | "degraded" | "unhealthy";
    checks: Record<string, boolean>;
  }>
> {
  try {
    const checks: Record<string, boolean> = {};

    // GitHub API接続チェック
    try {
      const testResult = await getAllPosts();
      checks.githubAPI = testResult.success;
    } catch {
      checks.githubAPI = false;
    }

    // 認証システムチェック
    try {
      // const session = await AuthService.getCurrentSession();
      checks.auth = true;
    } catch {
      checks.auth = false;
    }

    // 環境変数チェック
    checks.githubToken = !!process.env.GITHUB_TOKEN;

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: "healthy" | "degraded" | "unhealthy";
    if (healthyChecks === totalChecks) {
      status = "healthy";
    } else if (healthyChecks >= totalChecks * 0.5) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    return {
      success: true,
      data: { status, checks },
    };
  } catch (error) {
    console.error("Error in health check:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "ヘルスチェックに失敗しました",
    };
  }
}
