import type { WikiHistoryEntry, WikiThumbnail } from "@morinoparty/hagaki";
import { CONTENT_BASE_URL } from "./content";
import { createTtlCache } from "./ttlCache";

// 履歴は wiki-content のデプロイのたびにしか変わらないので、1 時間使い回す
const infoCache = createTtlCache<ArticleInfo>(60 * 60 * 1000);

/**
 * 生成物 `article/<uuid>/info.json` の中身。
 *
 * wiki-content の `scripts/generate-lists.ts` が
 * frontmatter の `modified`(移行前の履歴) と git のコミット履歴をマージして
 * 書き出している。hagaki の `posts.getByUuid` は created / updated しか
 * 取り出さないため、編集履歴が欲しい場合はこちらを直接読む。
 */
export interface ArticleInfo {
  title: string;
  slug: string;
  uuid: string;
  category: string;
  description: string;
  thumbnail: WikiThumbnail | null;
  created: string | null;
  updated: string | null;
  history: WikiHistoryEntry[];
}

/** 記事一件の `info.json` を取得する。未生成・取得失敗時は null。 */
export async function getArticleInfo(
  uuid: string
): Promise<ArticleInfo | null> {
  const cached = infoCache.get(uuid);
  if (cached) return cached;
  const url = `${CONTENT_BASE_URL}/article/${encodeURIComponent(uuid)}/info.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const info = (await res.json()) as ArticleInfo;
    const normalized = {
      ...info,
      history: Array.isArray(info.history) ? info.history : [],
    };
    infoCache.set(uuid, normalized);
    return normalized;
  } catch (error) {
    console.error(`Error fetching info.json for ${uuid}:`, error);
    return null;
  }
}
