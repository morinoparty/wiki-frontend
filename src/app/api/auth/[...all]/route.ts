import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// BetterAuth インスタンスはリクエストの origin ごとに遅延生成するため、
// toNextJsHandler には handler を委譲する薄いラッパを渡す。
export const { GET, POST } = toNextJsHandler({
  handler: async (request: Request) => (await getAuth()).handler(request),
});
