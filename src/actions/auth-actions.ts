"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

/**
 * MineAuth の認可エンドポイントへリダイレクトする。
 *
 * `signInWithOAuth2` は state / PKCE の verifier をクッキーに書き出したうえで
 * 認可 URL を返す。Server Action からの `Set-Cookie` は `nextCookies()`
 * プラグインが Next.js の cookies() に転送する。
 */
export async function signInWithMineAuth() {
  const auth = await getAuth();
  const result = await auth.api.signInWithOAuth2({
    body: {
      providerId: "MineAuth",
      callbackURL: "/",
    },
    headers: await headers(),
  });

  const redirectUrl = typeof result === "string" ? result : result.url;
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
