import { createServerFn } from "@tanstack/react-start";
import {
  normalizeEditorList,
  type ApiResult,
  type CreatePostInput,
  type OperationContext,
  type UpdatePostInput,
} from "./types";
import { EDITOR_LIST_PERSISTED, type WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { ValidationService } from "./services/validation-service";
import { AuthService } from "./services/auth-service";
import {
  locksOutSelf,
  PermissionService,
  toPostActor,
} from "./services/permission-service";
import {
  PostImageError,
  exceedsSaveLimit,
  postCommitMessage,
  readImageUploads,
} from "./services/post-images";
import { getAllCategories } from "@/lib/getAllCategories";
import { validateOptionValues } from "@/lib/categoryOptions";
import { findSlugOwner, getTakenSlugs } from "@/lib/takenSlugs";
import { rememberRepoOnlyPost } from "@/lib/getDashboardPosts";
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

/** 権限が無いときに返すメッセージ。 */
const FORBIDDEN_MESSAGE = "この記事を編集する権限がありません";

/** 編集者リストから自分を外す保存を断るときのメッセージ。 */
const SELF_LOCKOUT_MESSAGE =
  "編集者リストに自分が含まれていません。自分を含めるか、リストを空にしてください";

/** 下書きにすると保存したユーザー自身が触れなくなるときのメッセージ。 */
const DRAFT_LOCKOUT_MESSAGE =
  "下書きにすると、この記事を編集できなくなります。下書きは作成者・編集者リストのプレイヤー・スタッフだけが編集できます";

/** 編集者リストを保存できない (hagaki が未対応の) 間に、リストが送られてきたときのメッセージ。 */
const EDITOR_LIST_UNSUPPORTED_MESSAGE =
  "編集者リストはまだ保存できません (hagaki の更新待ち)";

/** slug が他の記事 (下書きを含む) と被っているときのメッセージ。 */
const SLUG_TAKEN_MESSAGE =
  "このスラッグは既に別の記事 (下書きを含む) で使用されています";

/**
 * 新しい記事を作成する
 *
 * 作成者 (最初のコミットのプレイヤー) が下書きの持ち主になる。
 */
export const createPost = createServerFn({ method: "POST" })
  .validator((d: CreatePostRequest) => d)
  .handler(
    async ({ data }): Promise<ApiResult<WikiPostDetail>> => {
      const { input: rawInput, context = {} } = data;
      try {
        // 1. 認証チェック
        const session = await AuthService.getCurrentSession();
        const actor = toPostActor(session);
        if (!actor) {
          return { success: false, error: "認証が必要です", code: "unauthenticated" };
        }

        // 2. 入力データの検証。以降は parse 済みの値だけを使う
        // (スキーマに無いキーを frontmatter に紛れ込ませない)
        const validationResult = ValidationService.validateCreateInput(rawInput);
        if (!validationResult.success) {
          return { success: false, error: validationResult.error };
        }
        const input = validationResult.data;

        // 3. 権限チェック
        const hasPermission = await PermissionService.checkPermission(
          actor,
          "write"
        );
        if (!hasPermission) {
          return { success: false, error: "記事作成の権限がありません" };
        }

        // 4. 編集者リスト。保存できない間は断り、自分を締め出すリストでは作らせない
        const editor = normalizeEditorList(input.editor);
        if (!EDITOR_LIST_PERSISTED && editor.length > 0) {
          return { success: false, error: EDITOR_LIST_UNSUPPORTED_MESSAGE };
        }
        if (locksOutSelf(actor, editor)) {
          return { success: false, error: SELF_LOCKOUT_MESSAGE };
        }

        // 5. uuid。指定された場合は既存の記事を上書きしないよう確認する
        // (createPost は権限チェックを経ずに posts.save するため、既存 uuid を
        // 許すと他人の下書きを作成扱いで書き換えられてしまう)
        const uuid = input.uuid ?? crypto.randomUUID();
        if (input.uuid && (await GitHubService.checkPostExistsByUuid(uuid))) {
          return { success: false, error: "この記事 ID は既に使用されています" };
        }

        // 6. スラッグの重複チェック。公開記事と、リポジトリにしか無い記事
        // (他人の下書きやデプロイ待ちを含む) の両方と突き合わせる
        const takenSlugs = await getTakenSlugs();
        if (findSlugOwner(takenSlugs, input.slug)) {
          return { success: false, error: SLUG_TAKEN_MESSAGE };
        }

        // 7. カテゴリが option で宣言したフィールドの検証
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

        // 8. 記事データの準備。保存するフィールドを明示的に並べる
        const postData: WikiPostDetail = {
          uuid,
          title: input.title,
          slug: input.slug,
          body: input.body,
          category: input.category,
          description: input.description,
          thumbnail: input.thumbnail ?? null,
          created: null,
          updated: null,
          ...(input.option ? { option: input.option } : {}),
          // 空のリストは書かない (draft と同じく、無いことが既定値)
          ...(editor.length > 0 ? { editor } : {}),
          // 新規作成は下書きから始める。配信されるのはエディタで下書きを
          // 外して保存したあと (draft は frontmatter に永続化される)。
          draft: input.draft ?? true,
        };

        // 9. GitHubに保存
        const commitResult = await GitHubService.createPost(
          postData,
          context.commitMessage || `Create post: ${input.title}`,
          session
        );

        if (!commitResult.success) {
          return { success: false, error: commitResult.error };
        }
        // 作成者 = 下書きの持ち主。直後に開く編集ページで履歴の反映を待たずに済むよう覚えておく
        PermissionService.rememberPostCreator(postData.uuid, actor.userId);
        // 使用中 slug の計算 (リポジトリにしか無い記事のキャッシュ) にもすぐ反映する
        rememberRepoOnlyPost(postData);

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
        const { input: rawInput, context = {} } = payload;

        // 1. 認証チェック
        const session = await AuthService.getCurrentSession();
        const actor = toPostActor(session);
        if (!actor) {
          return { success: false, error: "認証が必要です", code: "unauthenticated" };
        }

        // 2. 入力データの検証。以降は parse 済みの値だけを使う
        const validationResult = ValidationService.validateUpdateInput(rawInput);
        if (!validationResult.success) {
          return { success: false, error: validationResult.error };
        }
        const input = validationResult.data;

        // 3. 既存記事の取得。draft は slug-index に載らないため、slug ではなく
        // uuid でリポジトリから直接引く (未配信の変更も見える)。
        const existingPost = await GitHubService.getPostByUuid(input.uuid);
        if (!existingPost) {
          return { success: false, error: "記事が見つかりません", code: "not_found" };
        }

        // 4. 権限チェック (保存前の状態で判定する)。下書きは作成者・編集者リスト・
        // スタッフだけ、公開記事は編集者リストがあればそのプレイヤーとスタッフだけ
        const hasPermission = await PermissionService.checkPostPermission(
          actor,
          existingPost,
          "write"
        );
        if (!hasPermission) {
          return { success: false, error: FORBIDDEN_MESSAGE, code: "forbidden" };
        }

        // 5. 保存後の編集者リストと公開状態。送られなければ既存の値を保つ。
        // draft は「送られなかった」(undefined) と「下書きを外した」(false) を区別する
        const editor = normalizeEditorList(
          input.editor !== undefined ? input.editor : existingPost.editor
        );
        if (
          !EDITOR_LIST_PERSISTED &&
          input.editor !== undefined &&
          editor.length > 0
        ) {
          return { success: false, error: EDITOR_LIST_UNSUPPORTED_MESSAGE };
        }
        const draft =
          typeof input.draft === "boolean" ? input.draft : existingPost.draft;

        // 保存後の状態でも本人が触れるかを確かめる (スタッフは常に可)。
        // 編集者リストから自分を外す保存や、作成者でない人が公開記事を下書きに
        // する保存は、本人が二度と開けなくなり元に戻せないので断る。
        // 下書きの作成者は編集者リストに入っていなくても触れるので、通る
        const canEditAfterSave = await PermissionService.checkPostPermission(
          actor,
          { uuid: input.uuid, draft, editor },
          "write"
        );
        if (!canEditAfterSave) {
          const becomesDraft = draft === true && existingPost.draft !== true;
          return {
            success: false,
            error: becomesDraft ? DRAFT_LOCKOUT_MESSAGE : SELF_LOCKOUT_MESSAGE,
          };
        }

        // 6. slug の重複チェック。下書きか公開かに関係なく毎回行う。
        // 公開記事とリポジトリにしか無い記事 (他人の下書きを含む) の slug を
        // 集め、自分自身 (uuid) は除いて突き合わせる。被ったまま公開すると
        // `hagaki generate` が fail してコンテンツのデプロイ全体が止まるため
        const takenSlugs = await getTakenSlugs();
        if (findSlugOwner(takenSlugs, input.slug, input.uuid)) {
          return { success: false, error: SLUG_TAKEN_MESSAGE };
        }

        // 7. カテゴリが option で宣言したフィールドの検証（カテゴリが更新される場合）
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

        // 8. 更新データの準備。既存記事に、parse 済みの入力のうち送られてきた
        // フィールドだけを重ねる (生の入力は展開しない)。
        const { editor: _previousEditor, ...existingFields } = existingPost;
        void _previousEditor;
        const updatedPost: WikiPostDetail = {
          ...existingFields,
          slug: input.slug,
          ...definedFields({
            title: input.title,
            body: input.body,
            category: input.category,
            description: input.description,
          }),
          // null は「サムネイルを外した」、undefined は「送られなかった」
          ...(input.thumbnail !== undefined
            ? { thumbnail: input.thumbnail }
            : {}),
          draft,
          // option はキー単位でマージする。丸ごと差し替えると、送らなかった
          // フィールド (エディタが編集しないものなど) が消える
          ...(input.option
            ? { option: { ...existingPost.option, ...input.option } }
            : {}),
          // 空のリストは書かない (無いことが「全員編集可」)
          ...(editor.length > 0 ? { editor } : {}),
        };

        // 9. 画像の検証 (形式・サイズ・id)。パスはサーバー側で組み立てる
        const files = await readImageUploads(input.uuid, form);

        // 10. GitHubに保存
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
        // 使用中 slug の計算 (リポジトリにしか無い記事のキャッシュ) にもすぐ反映する
        rememberRepoOnlyPost(updatedPost);

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
 * 値が undefined のキーを落とす。部分更新で「送られなかった」フィールドが
 * 既存の値を undefined で上書きしないようにする。
 */
function definedFields<T extends Record<string, unknown>>(
  fields: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

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
 *
 * 編集できない記事 (他人の下書き、編集者リストに入っていない記事) は
 * `code: "forbidden"` で失敗を返し、記事の中身 (タイトルなど) は返さない。
 */
export const getPostForEdit = createServerFn({ method: "GET" })
  .validator((uuid: string) => uuid)
  .handler(
    async ({ data: uuid }): Promise<ApiResult<WikiPostDetail>> => {
      try {
        const actor = toPostActor(await AuthService.getCurrentSession());
        if (!actor) {
          return { success: false, error: "認証が必要です", code: "unauthenticated" };
        }

        const post = await GitHubService.getPostByUuid(uuid);
        if (!post) {
          return { success: false, error: "記事が見つかりません", code: "not_found" };
        }

        const hasPermission = await PermissionService.checkPostPermission(
          actor,
          post,
          "write"
        );
        if (!hasPermission) {
          return { success: false, error: FORBIDDEN_MESSAGE, code: "forbidden" };
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
