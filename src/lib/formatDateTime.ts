// サーバー側でレンダリングするため、ロケールとタイムゾーンは明示する。
// 実行環境(Cloudflare Workers は UTC)に引きずられないようにするため
const dateTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Tokyo",
});

/** ISO 8601 の日時を「2026/08/10 09:30」形式にする。不正な値は空文字。 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dateTimeFormat.format(date);
}

/** ISO 8601 の日時を「2026/08/10」形式にする。不正な値は空文字。 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormat.format(date);
}
