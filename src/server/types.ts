/**
 * 記事操作の server function (`src/server/posts.ts` / `history.ts`) が使う型と
 * Zod スキーマ。zod だけに依存し、クライアントコンポーネントから import してよい。
 */
import { z } from "zod";

/**
 * 失敗の種類。画面の出し分けに使う (例: 編集ページで権限が無いときは
 * エディタの代わりに案内を出す)。
 */
export type ApiErrorCode = "unauthenticated" | "not_found" | "forbidden";

// API操作の結果型
export type ApiResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  /** 失敗の種類。必要な箇所でだけ付ける */
  code?: ApiErrorCode;
  commitId?: string;
};

// 操作権限の種類
export type Permission = "read" | "write";

// 操作のコンテキスト
export type OperationContext = {
  userId?: string;
  userName?: string;
  commitMessage?: string;
  /** 本文から消えた画像のリポジトリパス。同じコミットで削除する。 */
  deletePaths?: string[];
};

// Zodスキーマ定義
/**
 * 編集者リストの 1 要素 (Minecraft UUID)。クライアントの入力欄も
 * `isEditorId` で同じ規則を使い、入力欄では通るのに保存で断られる、を防ぐ。
 */
export const EditorIdSchema = z.uuid("編集者は Minecraft UUID で指定してください");

/** 編集者リストの 1 要素として受け付けられる値か (`EditorIdSchema` と同じ規則)。 */
export function isEditorId(id: string): boolean {
  return EditorIdSchema.safeParse(id).success;
}

export const CreatePostInputSchema = z.object({
  // 記事の同一性は uuid で持つ (slug は変わりうる)
  uuid: z.uuid("記事 ID が uuid ではありません").optional(),
  title: z
    .string()
    .trim()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください"),
  slug: z
    .string()
    .trim()
    .min(1, "スラッグは必須です")
    .max(100, "スラッグは100文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
      "スラッグは英数字、ハイフン、アンダースコア、ひらがな、カタカナ、漢字のみ使用できます"
    ),
  body: z.string().trim().min(1, "本文は必須です"),
  category: z.string().trim().min(1, "カテゴリは必須です"),
  description: z
    .string()
    .trim()
    .min(1, "説明は必須です")
    .max(500, "説明は500文字以内で入力してください"),
  // サムネイル。記事の assets 配下にある AVIF を imageId で指す
  thumbnail: z
    .object({
      imageId: z.uuid("画像 ID が uuid ではありません"),
      blurhash64: z.string().default(""),
    })
    .nullish(),
  // カテゴリが option で宣言したフィールドの値。frontmatter の `option.<key>` に保存される。enum は選択肢の id が入る。
  // 宣言との突き合わせ (必須・型・選択肢) は categoryOptions 側で行う
  option: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  // 下書きフラグ。frontmatter に永続化され、true の間は配信されない
  draft: z.boolean().optional(),
  // 編集できるプレイヤー (Minecraft UUID) の一覧。frontmatter の `editor` に保存される。
  // 空 (未指定) ならログイン済みの全員が編集できる。正規化 (小文字化・重複除去) は
  // normalizeEditorList が行う
  editor: z.array(EditorIdSchema).optional(),
});

export const UpdatePostInputSchema = CreatePostInputSchema.partial().extend({
  // 更新対象の同一性は uuid で持つ (slug は変わりうるし、draft は
  // slug-index に載らないため slug では解決できない)
  uuid: z.uuid("記事 ID が uuid ではありません"),
  slug: z
    .string()
    .trim()
    .min(1, "スラッグは必須です")
    .max(100, "スラッグは100文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
      "スラッグは英数字、ハイフン、アンダースコア、ひらがな、カタカナ、漢字のみ使用できます"
    ),
});

// 記事作成時の入力データ
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

// 記事更新時の入力データ
export type UpdatePostInput = z.infer<typeof UpdatePostInputSchema>;

// 履歴アイテム
export type PostHistoryItem = {
  commitId: string;
  version: number;
  message: string;
  author: string;
  date: string;
  changes: string[];
};

// バリデーションエラー
export type ValidationError = {
  field: string;
  message: string;
};

/**
 * 編集者リストを正規化する。前後の空白を落とし、空要素を除き、小文字にそろえて
 * 重複を取り除く。frontmatter の `editor` は YAML 配列だけを受け付け、
 * それ以外の形 (カンマ区切りの文字列など) は空として扱う。
 *
 * @param value frontmatter / 入力の値 (配列・未設定)
 * @returns 正規化した UUID の配列。空なら空配列
 */
export function normalizeEditorList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const id = item.trim().toLowerCase();
    if (id.length > 0 && !result.includes(id)) result.push(id);
  }
  return result;
}

/**
 * エディタの入力欄 (カンマ・改行区切りのテキスト) を編集者リストにする。
 * 区切り文字を解釈するのは入力欄だけで、frontmatter の形式は YAML 配列に限る。
 *
 * @param text 入力欄の値
 * @returns 正規化した UUID の配列。空なら空配列
 */
export function parseEditorInput(text: string): string[] {
  return normalizeEditorList(text.split(/[,\n]/));
}

/**
 * ログイン後の戻り先。オープンリダイレクトを防ぐため、同じオリジン内の
 * パス (`/` で始まり、`//` や `/\` で始まらない) だけを受け付ける。
 */
export const RedirectPathSchema = z
  .string()
  .max(2048)
  .refine(
    (path) => path.startsWith("/") && !/^\/[/\\]/.test(path),
    "戻り先はサイト内のパスである必要があります",
  );

/** 戻り先として安全なパスならそれを、そうでなければ `/` を返す。 */
export function toSafeRedirectPath(value: unknown): string {
  const result = RedirectPathSchema.safeParse(value);
  return result.success ? result.data : "/";
}
