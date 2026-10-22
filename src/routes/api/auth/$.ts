import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "@/lib/auth";

// BetterAuth インスタンスはリクエストの origin ごとに遅延生成するため、
// リクエストのたびに getAuth() から handler を引く。
const handler = async ({ request }: { request: Request }) =>
  (await getAuth()).handler(request);

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
