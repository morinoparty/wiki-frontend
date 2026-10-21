"use server";

import { ApiResult, UpdatePostInput, OperationContext } from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { ValidationService } from "./services/validation-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";
import { getAllCategories } from "@/lib/getAllCategories";
import {
  PostImageError,
  postCommitMessage,
  readImageUploads,
} from "./services/post-images";
import { validateOptionValues } from "@/lib/categoryOptions";
import { getHagakiClient } from "@/lib/hagaki";
import { toUrlSlug } from "hagaki";

/**
 * 既存の記事を更新する
 *
 * @param images 本文 (とサムネイル) が新しく参照する画像。ブラウザでエンコード
 *   した AVIF を `src/lib/post-images.ts` の取り決めで詰めた FormData。
 *   本文と同じコミットに入る。
 */
export async function updatePost(
  input: UpdatePostInput,
  context: OperationContext = {},
  images?: FormData
): Promise<ApiResult<WikiPostDetail>> {
  try {
    // 1. 認証チェック
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 2. 入力データの検証
    const validationResult = ValidationService.validateUpdateInput(input);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error };
    }

    // 3. 既存記事の取得。draft は slug-index に載らないため、slug ではなく
    // uuid でリポジトリから直接引く (未配信の変更も見える)。
    const existingPost = await GitHubService.getPostByUuid(input.uuid);
    if (!existingPost) {
      return { success: false, error: "記事が見つかりません" };
    }

    // 4. 権限チェック
    const hasPermission = await PermissionService.checkPostPermission(
      session.user.id,
      existingPost,
      "write"
    );
    if (!hasPermission) {
      return {
        success: false,
        error: "この記事を編集する権限がありません",
      };
    }

    // 5. slug 衝突チェック（公開する保存のみ）。draft は slug-index に
    // 載らないため、公開時に既存の公開記事と slug が被っていると
    // `hagaki generate` が fail してコンテンツのデプロイ全体が止まる。
    // ここで公開前に弾く (draft 同士の残余ケースは生成側の fail が防波堤)。
    if (input.draft !== true) {
      const conflicting = await getHagakiClient().posts.getBySlug(
        toUrlSlug(input.slug)
      );
      if (conflicting && conflicting.uuid !== input.uuid) {
        return {
          success: false,
          error: "このスラッグは既に別の記事で使用されています",
        };
      }
    }

    // 6. カテゴリが option で宣言したフィールドの検証（カテゴリが更新される場合）
    if (input.category && input.category !== existingPost.category) {
      const categories = await getAllCategories();
      const newCategory = categories.find((cat) => cat.slug === input.category);
      if (!newCategory) {
        return { success: false, error: "指定されたカテゴリが見つかりません" };
      }

      // 送られてこなかったキーは既存記事の値がそのまま残るので、
      // マージ後の値を新カテゴリの宣言と突き合わせる
      const optionError = validateOptionValues(newCategory, {
        ...existingPost.option,
        ...input.option,
      });
      if (optionError) {
        return { success: false, error: optionError };
      }
    }

    // 7. 更新データの準備。draft は「送られなかった」(undefined) と
    // 「下書きを外した」(false) を区別する — undefined で既存値を保つ。
    const updatedPost: WikiPostDetail = {
      ...existingPost,
      ...input,
      draft: typeof input.draft === "boolean" ? input.draft : existingPost.draft,
      // option はキー単位でマージする。丸ごと差し替えると、送らなかった
      // フィールド (エディタが編集しない座標など) が消える
      ...(input.option
        ? { option: { ...existingPost.option, ...input.option } }
        : {}),
    };

    // 8. 画像の検証 (形式・サイズ・id)。パスはサーバー側で組み立てる
    const files = await readImageUploads(input.uuid, images);

    // 9. GitHubに保存
    const deletePaths = context.deletePaths ?? [];
    const commitResult = await GitHubService.updatePost(
      updatedPost,
      context.commitMessage ||
        postCommitMessage(updatedPost.slug, files.length, deletePaths.length),
      session,
      { files, deletePaths }
    );

    if (!commitResult.success) {
      return { success: false, error: commitResult.error };
    }

    return {
      success: true,
      data: updatedPost,
      commitId: commitResult.commitId,
    };
  } catch (error) {
    if (error instanceof PostImageError) {
      return { success: false, error: error.message };
    }
    console.error("Error updating post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の更新に失敗しました",
    };
  }
}
