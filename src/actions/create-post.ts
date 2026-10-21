"use server";

import { ApiResult, CreatePostInput, OperationContext } from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { ValidationService } from "./services/validation-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";
import { getAllCategories } from "@/lib/getAllCategories";
import { validateOptionValues } from "@/lib/categoryOptions";

/**
 * 新しい記事を作成する
 */
export async function createPost(
  input: CreatePostInput,
  context: OperationContext = {}
): Promise<ApiResult<WikiPostDetail>> {
  try {
    // 1. 認証チェック
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 2. 入力データの検証
    const validationResult = ValidationService.validateCreateInput(input);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error };
    }

    // 3. 権限チェック
    const hasPermission = await PermissionService.checkPermission(
      session.user.id,
      "write"
    );
    if (!hasPermission) {
      return { success: false, error: "記事作成の権限がありません" };
    }

    // 4. スラッグの重複チェック
    // 配信中の slug-index 経由なので draft のスラッグまでは見えない。
    // 公開記事同士の重複は生成側 (hagaki generate) が fail して防ぐ。
    const exists = await GitHubService.checkPostExists(input.slug);
    if (exists) {
      return { success: false, error: "このスラッグは既に使用されています" };
    }

    // 5. カテゴリが option で宣言したフィールドの検証
    const categories = await getAllCategories();
    const category = categories.find((cat) => cat.slug === input.category);
    if (!category) {
      return { success: false, error: "指定されたカテゴリが見つかりません" };
    }

    // 必須・型・enum の選択肢を宣言と突き合わせる（座標もこの経路）
    const optionError = validateOptionValues(category, input.option);
    if (optionError) {
      return { success: false, error: optionError };
    }

    // 6. 記事データの準備
    const postData: WikiPostDetail = {
      ...input,
      body: input.body,
      uuid: input.uuid ?? crypto.randomUUID(),
      thumbnail: input.thumbnail ?? null,
      created: null,
      updated: null,
      // 新規作成は下書きから始める。配信されるのはエディタで下書きを
      // 外して保存したあと (draft は frontmatter に永続化される)。
      draft: input.draft ?? true,
    };

    // 7. GitHubに保存
    const commitResult = await GitHubService.createPost(
      postData,
      context.commitMessage || `Create post: ${input.title}`,
      session
    );

    if (!commitResult.success) {
      return { success: false, error: commitResult.error };
    }

    return {
      success: true,
      data: postData,
      commitId: commitResult.commitId,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の作成に失敗しました",
    };
  }
}
