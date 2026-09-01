import { z } from "zod";

// API操作の結果型
export type ApiResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  commitId?: string;
};

// 操作権限の種類
export type Permission = "read" | "write" | "delete";

// 操作のコンテキスト
export type OperationContext = {
  userId?: string;
  userName?: string;
  commitMessage?: string;
  /**
   * 本文が参照する未コミット画像の id。編集中は R2 の一時置き場にあり、
   * 保存時に記事本文と同じコミットへ移す。
   */
  pendingImageIds?: string[];
  /** 本文から消えた画像のリポジトリパス。同じコミットで削除する。 */
  deletePaths?: string[];
};

// Zodスキーマ定義
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
  // 座標情報（option で x / y を宣言しているカテゴリで必須）
  x: z.number().int("X座標は整数で入力してください").optional(),
  y: z.number().int("Y座標は整数で入力してください").optional(),
  // 下書きフラグ。frontmatter に永続化され、true の間は配信されない
  draft: z.boolean().optional(),
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
