import type {
  CategoryOptionEnumValue,
  CategoryOptionField,
  EditorSummary,
  PostOptionValues,
  GetAllPostsOptions as HagakiGetAllPostsOptions,
  WikiCategory as HagakiCategory,
  WikiPost as HagakiPost,
  WikiPostDetail as HagakiPostDetail,
  WikiThumbnail,
} from "@morinoparty/hagaki";

export type {
  CategoryOptionEnumValue,
  CategoryOptionField,
  PostOptionValues,
  WikiThumbnail,
};

/**
 * 記事一件の編集者一人分の集計。wiki-content の生成物
 * (`article.json` の `editors`) が正で、履歴をプレイヤーごとに畳んだもの。
 * `player` は Minecraft UUID で、better-auth の user.id と同じ値。
 */
export type ArticleEditor = EditorSummary;

// 生成物 (article.json) 由来のフィールド。hagaki の WikiPost には無い。
type GeneratedMetadata = {
  editors?: ArticleEditor[];
};

// 投稿データの型定義。カテゴリ固有の値 (enum の選択など) は hagaki 側の
// `option` (frontmatter の `option.<key>`) に入る
export type WikiPost = HagakiPost & GeneratedMetadata;

// 詳細取得時（bodyあり）
export type WikiPostDetail = HagakiPostDetail;

export type GetAllPostsOptions = HagakiGetAllPostsOptions;

export type WikiCategory = HagakiCategory;

/** 記事の表示用日時。生成物が無い記事では空文字。 */
export function postDate(post: Pick<WikiPost, "updated" | "created">): string {
  return post.updated ?? post.created ?? "";
}
