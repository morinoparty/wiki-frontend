import {
  summarizeEditors,
  type EditorSummary,
  type PathCommit,
  type WikiHistoryEntry,
} from "@morinoparty/hagaki";

/**
 * hagaki / wiki-content の生成物に入っている「誰の編集か」を読むための、ただ一つのアダプタ。
 *
 * hagaki は次の版で `player` を `userId` (better-auth の `session.user.id`) へ
 * 改名する。wiki-frontend が読むデータは移行の途中で両方の形がありうる。
 *
 * - インストール済みの hagaki 0.3.0 の型と API (`PathCommit.player`,
 *   `summarizeEditors` が読む `WikiHistoryEntry.player`)
 * - 配信中の wiki-content の生成物 (`article.json` の `editors[]`, `info.json` の
 *   `history[]`)。移行前は `player`、移行後は `userId`
 *
 * そこで `userId ?? player` の順に読み、アプリ内では `userId` だけを使う。
 * フィールド名の違いを知っているのはこのファイルだけにしておく。
 *
 * TODO(hagaki の改名版へ上げたら): `player` へのフォールバックと、
 * `summarizeContentEditors` での詰め替えを消す。どちらも hagaki の `userId` を
 * そのまま使えばよくなる。
 */

/** `userId` (改名後) と `player` (改名前) のどちらか、または両方を持つレコード。 */
export interface ContentUserFields {
  userId?: string | null;
  player?: string | null;
}

/**
 * 生成物 `article.json` の `editors[]` 一件分。移行前後のどちらの形でも読めるよう、
 * hagaki 0.3.0 の `EditorSummary` から `player` を外して両方を任意にしている。
 */
export type ContentEditorSummary = Omit<EditorSummary, "player"> &
  ContentUserFields;

/** 生成物 `info.json` の `history[]` 一件分 (移行前後のどちらの形でも読める)。 */
export type ContentHistoryEntry = Omit<WikiHistoryEntry, "player"> &
  ContentUserFields;

/** コミット一件分。hagaki 0.3.0 の `PathCommit` と、改名後の版のどちらでも受け取れる。 */
export type ContentCommit = Omit<PathCommit, "player"> & ContentUserFields;

/** アプリ内で使う、編集者一人分の集計 (`userId` に統一したもの)。 */
export interface EditorUserSummary {
  /** better-auth の `session.user.id`。 */
  userId: string;
  edits: number;
  lastEditedAt: string;
}

/**
 * レコードから編集したユーザーの ID を取り出す。`userId` を優先し、無ければ
 * 移行前の `player` を使う。どちらも無い (空文字を含む) ときは null。
 */
export function contentUserId(record: ContentUserFields): string | null {
  return record.userId || record.player || null;
}

/**
 * `info.json` の履歴を、ユーザーごとの編集回数と最終編集日時に畳む。
 *
 * 集計そのものは hagaki の `summarizeEditors` に任せる。hagaki 0.3.0 は
 * `player` しか読まないため、渡す前に `contentUserId` で詰め替え、
 * 結果は `userId` に直して返す。ユーザーを特定できないエントリは数えない。
 */
export function summarizeContentEditors(
  history: ReadonlyArray<ContentHistoryEntry>
): EditorUserSummary[] {
  const entries: WikiHistoryEntry[] = history.map((entry) => ({
    date: entry.date,
    source: entry.source,
    commit: entry.commit,
    player: contentUserId(entry),
  }));
  return summarizeEditors(entries).map((summary) => ({
    userId: summary.player,
    edits: summary.edits,
    lastEditedAt: summary.lastEditedAt,
  }));
}
