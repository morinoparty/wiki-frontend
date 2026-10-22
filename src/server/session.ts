import { createServerFn } from "@tanstack/react-start";
import { getSession } from "@/lib/auth";

/** クライアントへ渡すログインユーザー。セッションのトークン類は含めない。 */
export interface SessionUser {
  /** Minecraft UUID */
  id: string;
  name: string;
  image: string | null;
}

/** 現在のログインユーザー。未ログインなら null。 */
export const fetchSessionUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    const session = await getSession();
    if (!session?.user) return null;
    return {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image ?? null,
    };
  }
);
