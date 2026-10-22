export const SITE_NAME = "もりのパーティ公式Wiki もりぱうぃき!";

/** ページタイトル。`<title> | <サイト名>` (title 未指定ならサイト名だけ)。 */
export function pageTitle(title?: string): string {
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}
