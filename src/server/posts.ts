import { createServerFn } from "@tanstack/react-start";
import { toUrlSlug } from "@morinoparty/hagaki";
import type {
  ApiResult,
  CreatePostInput,
  OperationContext,
  UpdatePostInput,
} from "./types";
import type { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { ValidationService } from "./services/validation-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";
import {
  PostImageError,
  exceedsSaveLimit,
  postCommitMessage,
  readImageUploads,
} from "./services/post-images";
import { getAllCategories } from "@/lib/getAllCategories";
import { validateOptionValues } from "@/lib/categoryOptions";
import { getHagakiClient } from "@/lib/hagaki";
import {
  IMAGE_FORM_FIELDS,
  SAVE_REQUEST_LIMIT_LABEL,
} from "@/lib/post-images";

/** `updatePost` の FormData で JSON の引数 (`{ input, context }`) を載せるフィールド。 */
const SAVE_PAYLOAD_FIELD = "payload";

/** `createPost` の入力。 */
export type CreatePostRequest = {
  input: CreatePostInput;
  context?: OperationContext;
};

/** `updatePost` の FormData の `payload` に JSON で入る値。 */
type UpdatePostPayload = {
  input: UpdatePostInput;
  context?: OperationContext;
};

/**
 * 新しい記事を作成する
 */
export const createPost = createServerFn({ method: "POST" })
  .validator((d: CreatePostRequest) => d)
  .handler(
    async ({ data }): Promise<ApiResult<WikiPostDetail>> => {
      const { input, context = {} } = data;
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

        // 必須・型・enum の選択肢を宣言と突き合わせる
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
  );

/**
 * 既存の記事を更新する
 *
 * 入力は FormData 1 つ。`payload` に `{ input, context }` の JSON、残りに
 * 本文 (とサムネイル) が新しく参照する画像を `src/lib/post-images.ts` の
 * 取り決めで詰める。画像は本文と同じコミットに入る。
 * クライアントからは `savePost(input, context, images)` 経由で呼ぶ。
 */
export const updatePost = createServerFn({ method: "POST" })
  .validator((d: FormData) => {
    if (!(d instanceof FormData)) {
      throw new Error("updatePost の入力は FormData です");
    }
    return d;
  })
  .handler(
    async ({ data: form }): Promise<ApiResult<WikiPostDetail>> => {
      try {
        // 0. リクエストサイズと引数の取り出し
        if (exceedsSaveLimit(form)) {
          return {
            success: false,
            error: `保存するデータが大きすぎます (${SAVE_REQUEST_LIMIT_LABEL} まで)`,
          };
        }
        const rawPayload = form.get(SAVE_PAYLOAD_FIELD);
        if (typeof rawPayload !== "string") {
          return { success: false, error: "保存データが不正です" };
        }
        let payload: UpdatePostPayload;
        try {
          payload = JSON.parse(rawPayload) as UpdatePostPayload;
        } catch {
          return { success: false, error: "保存データが不正です" };
        }
        const { input, context = {} } = payload;

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
          const newCategory = categories.find(
            (cat) => cat.slug === input.category
          );
          if (!newCategory) {
            return {
              success: false,
              error: "指定されたカテゴリが見つかりません",
            };
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
          draft:
            typeof input.draft === "boolean" ? input.draft : existingPost.draft,
          // option はキー単位でマージする。丸ごと差し替えると、送らなかった
          // フィールド (エディタが編集しないものなど) が消える
          ...(input.option
            ? { option: { ...existingPost.option, ...input.option } }
            : {}),
        };

        // 8. 画像の検証 (形式・サイズ・id)。パスはサーバー側で組み立てる
        const files = await readImageUploads(input.uuid, form);

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
  );

/**
 * 既存の記事を保存する (クライアント用)。旧 `updatePost` Server Action と
 * 同じ引数で、`{ input, context }` を JSON にして画像と 1 つの FormData に詰める。
 *
 * @param images 本文 (とサムネイル) が新しく参照する画像。ブラウザでエンコード
 *   した AVIF を `src/lib/post-images.ts` の取り決めで詰めた FormData。
 */
export function savePost(
  input: UpdatePostInput,
  context: OperationContext = {},
  images?: FormData
): Promise<ApiResult<WikiPostDetail>> {
  const form = new FormData();
  form.set(SAVE_PAYLOAD_FIELD, JSON.stringify({ input, context }));
  if (images) {
    // id と Blob の対応は順番で取るので、append の順を崩さずに写す
    for (const field of [IMAGE_FORM_FIELDS.id, IMAGE_FORM_FIELDS.file]) {
      for (const value of images.getAll(field)) form.append(field, value);
    }
  }
  return updatePost({ data: form });
}

/**
 * 編集用に記事を uuid で取得する（要認証）。
 *
 * リポジトリから直接読むため、未配信の変更や draft も見える。
 * 公開ページの読み取りは `@/lib/getAllPosts` / `@/lib/getPostBySlug`
 * (CDN 経由、draft は配信されないので自動的に除外) を使うこと。
 */
export const getPostForEdit = createServerFn({ method: "GET" })
  .validator((uuid: string) => uuid)
  .handler(
    async ({ data: uuid }): Promise<ApiResult<WikiPostDetail>> => {
      try {
        const session = await AuthService.getCurrentSession();
        if (!session?.user?.id) {
          return { success: false, error: "認証が必要です" };
        }

        const post = await GitHubService.getPostByUuid(uuid);
        if (!post) {
          return { success: false, error: "記事が見つかりません" };
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
  );
