import { z } from "zod";

// API操作の結果型
export type ApiResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  commitId?: string;
};

// 操作権限の種類
export type Permission =
  | "read"
  | "write"
  | "delete"
  | "lock"
  | "unlock"
  | "transfer_ownership"
  | "change_status";

// 操作のコンテキスト
export type OperationContext = {
  userId?: string;
  userName?: string;
  commitMessage?: string;
};

// Zodスキーマ定義
export const CreatePostInputSchema = z.object({
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
  image: z
    .union([
      z
        .string()
        .regex(
          /^(https?:\/\/|\/)[a-zA-Z0-9\-\._~:\/\?#\[\]@!\$&'\(\)\*\+,;=]+\.(jpg|jpeg|png|gif|svg|webp)$/i,
          "画像ファイルの形式が正しくありません（jpg, jpeg, png, gif, svg, webpのみ対応）"
        ),
      z.string().max(0), // 空文字を許容
      z.undefined(), // undefinedを許容
    ])
    .optional(),
  // 座標情報（hasPositionがtrueのカテゴリで必須）
  x: z.number().int("X座標は整数で入力してください").optional(),
  y: z.number().int("Y座標は整数で入力してください").optional(),
  status: z
    .enum(["draft", "published", "archived"], {
      errorMap: () => ({ message: "無効なステータスです" }),
    })
    .optional(),
  visibility: z
    .enum(["public", "private", "restricted"], {
      errorMap: () => ({ message: "無効な可視性設定です" }),
    })
    .optional(),
  priority: z
    .enum(["low", "medium", "high"], {
      errorMap: () => ({ message: "無効な優先度です" }),
    })
    .optional(),
});

export const UpdatePostInputSchema = CreatePostInputSchema.partial().extend({
  slug: z
    .string()
    .trim()
    .min(1, "スラッグは必須です")
    .max(100, "スラッグは100文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
      "スラッグは英数字、ハイフン、アンダースコア、ひらがな、カタカナ、漢字のみ使用できます"
    ),
  // image フィールドを明示的に上書きして、undefinedまたは空文字の場合も許容する
  image: z
    .union([
      z
        .string()
        .regex(
          /^(https?:\/\/|\/)[a-zA-Z0-9\-\._~:\/\?#\[\]@!\$&'\(\)\*\+,;=]+\.(jpg|jpeg|png|gif|svg|webp)$/i,
          "画像ファイルの形式が正しくありません（jpg, jpeg, png, gif, svg, webpのみ対応）"
        ),
      z.string().max(0), // 空文字を許容
      z.undefined(), // undefinedを許容
    ])
    .optional(),
});

// 記事作成時の入力データ
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

// 記事更新時の入力データ
export type UpdatePostInput = z.infer<typeof UpdatePostInputSchema>;

// ロック操作の入力データ
export type LockOperationInput = {
  slug: string;
  reason?: string;
};

// ステータス変更の入力データ
export type StatusChangeInput = {
  slug: string;
  status: "draft" | "published" | "archived";
  reason?: string;
};

// 所有者変更の入力データ
export type OwnershipTransferInput = {
  slug: string;
  newOwnerId: string;
  reason?: string;
};

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
