import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { SAVE_REQUEST_LIMIT_BYTES } from "@/lib/post-images";

/**
 * server function のリクエストボディ上限。
 *
 * 記事の保存 (本文 + 画像の FormData) が最大なので、その上限
 * `SAVE_REQUEST_LIMIT_BYTES` を全 server function に適用する。TanStack Start は
 * ハンドラの前に FormData を読み切るため、ここで Content-Length を見て
 * 読む前に 413 を返す (旧 next.config.ts の serverActions.bodySizeLimit 相当)。
 */
const serverFnBodyLimit = createMiddleware({ type: "request" }).server(
  ({ request, handlerType, next }) => {
    if (handlerType !== "serverFn" || request.method !== "POST") return next();
    const length = Number(request.headers.get("content-length"));
    // ブラウザの fetch(FormData / JSON) は必ず Content-Length を付ける
    if (!Number.isFinite(length) || length > SAVE_REQUEST_LIMIT_BYTES) {
      return new Response("Payload Too Large", { status: 413 });
    }
    return next();
  }
);

export const startInstance = createStart(() => ({
  // start.ts を置くと既定の CSRF 対策が外れるので、既定と同じものを明示する
  requestMiddleware: [
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" }),
    serverFnBodyLimit,
  ],
}));
