"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

/**
 * MineAuth の認可エンドポイントへリダイレクトする。
 *
 * genericOAuth のプロバイダも `signInSocial` で始める。state / PKCE の
 * verifier をクッキーに書き出したうえで認可 URL を返す。Server Action からの
 * `Set-Cookie` は `nextCookies()` プラグインが cookies() に転送する。
 * MineAuth 側に登録するコールバックは `<origin>/api/auth/callback/MineAuth`。
 */
export async function signInWithMineAuth() {
  const auth = await getAuth();
  const result = await auth.api.signInSocial({
    body: {
      provider: "MineAuth",
      callbackURL: "/",
      disableRedirect: true,
    },
    headers: await headers(),
  });

  const redirectUrl = result.url;
  if (!redirectUrl) {
    throw new Error("MineAuth の認可 URL を取得できませんでした");
  }
  // redirect() は NEXT_REDIRECT を throw するので try/catch で囲まないこと
  redirect(redirectUrl);
}

/**
 * サインアウトしてトップへ戻す。
 */
export async function signOutFromMineAuth() {
  const auth = await getAuth();
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
