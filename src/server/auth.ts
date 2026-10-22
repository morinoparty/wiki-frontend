import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getAuth } from "@/lib/auth";

/**
 * MineAuth の認可 URL を返す。呼び出し側で `location.href` に入れて遷移する。
 *
 * genericOAuth のプロバイダも `signInSocial` で始める。state / PKCE の
 * verifier をクッキーに書き出したうえで認可 URL を返す。server function からの
 * `Set-Cookie` は `tanstackStartCookies()` プラグインがレスポンスに転送する。
 * MineAuth 側に登録するコールバックは `<origin>/api/auth/callback/MineAuth`。
 */
export const signInWithMineAuth = createServerFn({ method: "POST" }).handler(
  async () => {
    const auth = await getAuth();
    const result = await auth.api.signInSocial({
      body: {
        provider: "MineAuth",
        callbackURL: "/",
        disableRedirect: true,
      },
      headers: getRequest().headers,
    });

    if (!result.url) {
      throw new Error("MineAuth の認可 URL を取得できませんでした");
    }
    return { url: result.url };
  }
);

/** サインアウトする。遷移とセッションの再取得は呼び出し側で行う。 */
export const signOutFromMineAuth = createServerFn({ method: "POST" }).handler(
  async () => {
    const auth = await getAuth();
    await auth.api.signOut({ headers: getRequest().headers });
  }
);

/** MineAuth のログインを始める (フォームの action から呼ぶ)。 */
export async function startSignIn() {
  const { url } = await signInWithMineAuth();
  window.location.href = url;
}
