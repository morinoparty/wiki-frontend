import { useRouteContext } from "@tanstack/react-router";
import type { SessionUser } from "@/server/session";

/** ログイン中のユーザー (root の beforeLoad で解決済み)。未ログインなら null。 */
export function useSessionUser(): SessionUser | null {
  return useRouteContext({ from: "__root__", select: (ctx) => ctx.user });
}
