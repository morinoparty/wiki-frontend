"use server";

import { ApiResult, OperationContext } from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";
import { GitHubService } from "./services/github-service";

/**
 * 複数の記事を一括削除
 */
export async function batchDeletePosts(
  slugs: string[],
  context: OperationContext = {}
): Promise<
  ApiResult<{
    successful: string[];
    failed: Array<{ slug: string; error: string }>;
  }>
> {
  try {
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    const successful: string[] = [];
    const failed: Array<{ slug: string; error: string }> = [];

    // 各記事を削除
    for (const slug of slugs) {
      try {
        const post = await GitHubService.getPost(slug);
        if (!post) {
          failed.push({ slug, error: "記事が見つかりません" });
          continue;
        }

        const hasPermission = await PermissionService.checkPostPermission(
          session.user.id,
          post,
          "delete"
        );
        if (!hasPermission) {
          failed.push({ slug, error: "削除権限がありません" });
          continue;
        }

        const deleteResult = await GitHubService.deletePost(
          slug,
          context.commitMessage || `Batch delete post: ${post.title}`,
          session
        );

        if (deleteResult.success) {
          successful.push(slug);
        } else {
          failed.push({
            slug,
            error: deleteResult.error || "削除に失敗しました",
          });
        }
      } catch (error) {
        failed.push({
          slug,
          error: error instanceof Error ? error.message : "予期しないエラー",
        });
      }
    }

    return {
      success: true,
      data: { successful, failed },
    };
  } catch (error) {
    console.error("Error in batch delete:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "一括削除に失敗しました",
    };
  }
}

/**
 * 複数の記事のステータスを一括変更
 */
export async function batchChangePostsStatus(
  slugs: string[],
  status: "draft" | "published" | "archived",
  context: OperationContext = {}
): Promise<
  ApiResult<{
    successful: string[];
    failed: Array<{ slug: string; error: string }>;
  }>
> {
  try {
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    const successful: string[] = [];
    const failed: Array<{ slug: string; error: string }> = [];

    for (const slug of slugs) {
      try {
        const post = await GitHubService.getPost(slug);
        if (!post) {
          failed.push({ slug, error: "記事が見つかりません" });
          continue;
        }

        const hasPermission = await PermissionService.checkPostPermission(
          session.user.id,
          post,
          "change_status"
        );
        if (!hasPermission) {
          failed.push({ slug, error: "ステータス変更権限がありません" });
          continue;
        }

        if (post.isLocked && post.documentOwner !== session.user.id) {
          failed.push({
            slug,
            error: "ロックされた記事は所有者のみが変更できます",
          });
          continue;
        }

        const now = new Date().toISOString();
        const updatedPost: WikiPostDetail = {
          ...post,
          status,
          lastModifiedBy: session.user.id,
          updatedAt: now,
        };

        const updateResult = await GitHubService.updatePost(
          updatedPost,
          context.commitMessage ||
            `Batch change status to ${status}: ${post.title}`,
          session
        );

        if (updateResult.success) {
          successful.push(slug);
        } else {
          failed.push({
            slug,
            error: updateResult.error || "更新に失敗しました",
          });
        }
      } catch (error) {
        failed.push({
          slug,
          error: error instanceof Error ? error.message : "予期しないエラー",
        });
      }
    }

    return {
      success: true,
      data: { successful, failed },
    };
  } catch (error) {
    console.error("Error in batch status change:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "一括ステータス変更に失敗しました",
    };
  }
}

/**
 * 記事の複製
 */
export async function duplicatePost(
  sourceSlug: string,
  newSlug: string,
  newTitle?: string,
  context: OperationContext = {}
): Promise<ApiResult<WikiPostDetail>> {
  try {
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 元記事の取得
    const sourcePost = await GitHubService.getPost(sourceSlug);
    if (!sourcePost) {
      return { success: false, error: "複製元の記事が見つかりません" };
    }

    // 読み取り権限チェック
    const hasReadPermission = await PermissionService.checkPostPermission(
      session.user.id,
      sourcePost,
      "read"
    );
    if (!hasReadPermission) {
      return {
        success: false,
        error: "複製元の記事を閲覧する権限がありません",
      };
    }

    // 作成権限チェック
    const hasCreatePermission = await PermissionService.checkPermission(
      session.user.id,
      "write"
    );
    if (!hasCreatePermission) {
      return { success: false, error: "記事作成の権限がありません" };
    }

    // 新しいスラッグの重複チェック
    const exists = await GitHubService.checkPostExists(newSlug);
    if (exists) {
      return {
        success: false,
        error: "指定されたスラッグは既に使用されています",
      };
    }

    // 複製データの準備
    const now = new Date().toISOString();
    const duplicatedPost: WikiPostDetail = {
      ...sourcePost,
      slug: newSlug,
      title: newTitle || `${sourcePost.title} (複製)`,
      // 複製は別の記事なので uuid を新しく採番する
      uuid: crypto.randomUUID(),
      created: null,
      updated: null,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user.id,
      documentOwner: session.user.id,
      lastModifiedBy: session.user.id,
      version: 1,
      status: "draft", // 複製は常にdraftから開始
      isLocked: false, // ロックは継承しない
      lockedAt: undefined,
      lockedBy: undefined,
    };

    // GitHubに保存
    const createResult = await GitHubService.createPost(
      duplicatedPost,
      context.commitMessage ||
        `Duplicate post from ${sourceSlug}: ${duplicatedPost.title}`,
      session
    );

    if (!createResult.success) {
      return { success: false, error: createResult.error };
    }

    return {
      success: true,
      data: duplicatedPost,
      commitId: createResult.commitId,
    };
  } catch (error) {
    console.error("Error duplicating post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の複製に失敗しました",
    };
  }
}
