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

// 記事作成時の入力データ
export type CreatePostInput = {
  title: string;
  slug: string;
  body: string;
  category: string;
  description: string;
  image?: string;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "private" | "restricted";
  priority?: "low" | "medium" | "high";
};

// 記事更新時の入力データ
export type UpdatePostInput = Partial<CreatePostInput> & {
  slug: string; // スラッグは必須（識別子として）
};

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
