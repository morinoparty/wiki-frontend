import type {
  CategoryOptionField,
  GetAllPostsOptions as HagakiGetAllPostsOptions,
  WikiCategory as HagakiCategory,
  WikiPost as HagakiPost,
  WikiPostDetail as HagakiPostDetail,
  WikiThumbnail,
} from "hagaki";

export type { CategoryOptionField, WikiThumbnail };

// 記事のメタデータ。hagaki のコンテンツフォーマット
// (content/article/<uuid>/index.mdx) が正で、以下は wiki-frontend の
// ダッシュボード機能だけが使う補助フィールド。
type DashboardMetadata = {
  // 座標情報（カテゴリが option で x / y を integer 宣言している場合に使用）
  x?: number;
  y?: number;
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
  // 旧フォーマット由来のタイムスタンプ。コンテンツには保存されない
  // (作成/更新日時は生成物の created / updated が正)。
  createdAt?: string;
  updatedAt?: string;
};

/**
 * 記事一件の編集者一人分の集計。wiki-content の生成物
 * (`article.json` の `editors`) が正で、履歴をプレイヤーごとに畳んだもの。
 */
export type ArticleEditor = {
  /** Minecraft UUID。better-auth の user.id と同じ値。 */
  player: string;
  /** その記事に対する編集回数。 */
  edits: number;
  /** 最後にその記事を編集した日時 (ISO 8601)。 */
  lastEditedAt: string;
};

// 生成物 (article.json) 由来のフィールド。hagaki の WikiPost には無い。
type GeneratedMetadata = {
  editors?: ArticleEditor[];
};

// 投稿データの型定義
export type WikiPost = HagakiPost & DashboardMetadata & GeneratedMetadata;

// 詳細取得時（bodyあり）
export type WikiPostDetail = HagakiPostDetail & DashboardMetadata;

export type GetAllPostsOptions = HagakiGetAllPostsOptions;

export type WikiCategory = HagakiCategory;

/** 記事の表示用日時。生成物が無い記事では空文字。 */
export function postDate(post: Pick<WikiPost, "updated" | "created">): string {
  return post.updated ?? post.created ?? "";
}
