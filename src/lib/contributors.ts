import type { WikiHistoryEntry } from "@morinoparty/hagaki";
import type { ArticleEditor } from "@/types/wiki";

/**
 * `info.json` の履歴から編集者を集計する。最終編集が新しい順。
 *
 * 生成物 `article.json` の `editors` と同じ畳み方 (wiki-content の
 * `summarizeEditors`)。記事ページは履歴そのものを持つ `info.json` を読むため、
 * こちら側でも同じ集計をする。
 *
 * `player` が null のエントリ(移行前の履歴やコミッター名が
 * `"<name> (<uuid>)"` 形式でないコミット)は誰の編集か辿れないため除外する。
 */
export function contributorsFromHistory(
  history: WikiHistoryEntry[]
): ArticleEditor[] {
  const byPlayer = new Map<string, ArticleEditor>();
  for (const entry of history) {
    if (!entry.player) continue;
    const current = byPlayer.get(entry.player);
    if (current) {
      current.edits += 1;
      if (entry.date > current.lastEditedAt) {
        current.lastEditedAt = entry.date;
      }
    } else {
      byPlayer.set(entry.player, {
        player: entry.player,
        edits: 1,
        lastEditedAt: entry.date,
      });
    }
  }
  return [...byPlayer.values()].sort((a, b) =>
    b.lastEditedAt.localeCompare(a.lastEditedAt)
  );
}
