import type {
  GetAllPostsOptions as HagakiGetAllPostsOptions,
  WikiCategory as HagakiCategory,
  WikiPost as HagakiPost,
  WikiPostDetail as HagakiPostDetail,
  WikiThumbnail,
} from "hagaki";

export type { WikiThumbnail };

// 記事のメタデータ。hagaki のコンテンツフォーマット
// (content/article/<uuid>/index.mdx) が正で、以下は wiki-frontend の
// ダッシュボード機能だけが使う補助フィールド。
type DashboardMetadata = {
  // 座標情報（hasPositionがtrueのカテゴリで使用）
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

// 投稿データの型定義
export type WikiPost = HagakiPost & DashboardMetadata;

// 詳細取得時（bodyあり）
export type WikiPostDetail = HagakiPostDetail & DashboardMetadata;

export type GetAllPostsOptions = HagakiGetAllPostsOptions;

export type WikiCategory = HagakiCategory;

/** 記事の表示用日時。生成物が無い記事では空文字。 */
export function postDate(post: Pick<WikiPost, "updated" | "created">): string {
  return post.updated ?? post.created ?? "";
}
