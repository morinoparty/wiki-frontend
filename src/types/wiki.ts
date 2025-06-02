// 投稿データの型定義
export type WikiPost = {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  image?: string;
  // 時間関連
  createdAt?: string;
  updatedAt?: string;
  // 作成者・所有者情報
  createdBy?: string;
  documentOwner?: string;
  lastModifiedBy?: string;
  // 公開状態・権限
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "private" | "restricted";
  // その他メタデータ
  version?: number;
  priority?: "low" | "medium" | "high";
  // ロック機能
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
};

// 詳細取得時（bodyあり）
export type WikiPostDetail = WikiPost & {
  body: string;
};

export type GetAllPostsOptions = {
  sortBy?: "date" | "title";
  order?: "asc" | "desc";
};

export type WikiCategory = {
  title: string;
  slug: string;
  body: string;
  hasPosition: boolean;
};

// 画像ファイル名リストの型定義
export type WikiImageFile = string;
