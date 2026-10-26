import { getRequest } from "@tanstack/react-start/server";

/**
 * 現在のリクエストの origin (`https://<host>`) を返す。
 *
 * 独自ドメインを持たず production / preview / ローカル開発で origin が変わるので、
 * 固定の URL ではなくリクエストのヘッダーから組み立てる。
 * リクエストコンテキスト内 (server function / server route / SSR の loader) からのみ
 * 呼び出せる。
 */
export function getRequestOrigin(): string {
  const headerList = getRequest().headers;
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:5173";
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}
