import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getAuth } from "@/lib/auth";
import { toSafeRedirectPath } from "./types";

/**
 * MineAuth の認可 URL を返す。呼び出し側で `location.href` に入れて遷移する。
 *
 * genericOAuth のプロバイダも `signInSocial` で始める。state / PKCE の
 * verifier をクッキーに書き出したうえで認可 URL を返す。server function からの
 * `Set-Cookie` は `tanstackStartCookies()` プラグインがレスポンスに転送する。
 * MineAuth 側に登録するコールバックは `<origin>/api/auth/callback/MineAuth`。
 *
 * `redirectTo` はログイン後に戻るサイト内のパス。サイト外の URL は `/` に置き換える。
 */
export const signInWithMineAuth = createServerFn({ method: "POST" })
  .validator((d: { redirectTo?: string }) => ({
    redirectTo: toSafeRedirectPath(d?.redirectTo),
  }))
  .handler(async ({ data }) => {
    const auth = await getAuth();
    const result = await auth.api.signInSocial({
      body: {
        provider: "MineAuth",
        callbackURL: data.redirectTo,
        disableRedirect: true,
      },
      headers: getRequest().headers,
    });

    if (!result.url) {
      throw new Error("MineAuth の認可 URL を取得できませんでした");
    }
    return { url: result.url };
  });

/** サインアウトする。遷移とセッションの再取得は呼び出し側で行う。 */
export const signOutFromMineAuth = createServerFn({ method: "POST" }).handler(
  async () => {
    const auth = await getAuth();
    await auth.api.signOut({ headers: getRequest().headers });
  }
);

/** 今いるページのパス (クエリとハッシュを含む)。 */
function currentPath(): string {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

/**
 * MineAuth のログインを始める。ログイン後は `redirectTo` (省略時は今いるページ) に戻る。
 *
 * フォームの `action` に直接渡すと第 1 引数に FormData が入るので、
 * `action={() => startSignIn()}` のように包んで呼ぶ。
 */
export async function startSignIn(redirectTo: string = currentPath()) {
  const { url } = await signInWithMineAuth({ data: { redirectTo } });
  window.location.href = url;
}
