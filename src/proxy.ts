import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  // proxy ではフルなセッション検証は行わず、セッションクッキーの
  // 存在だけを見る (better-auth 公式の推奨。Edge で DB / fetch を叩かない)。
  // 実際の認可は各 Server Action / Server Component 側の
  // `getSession()` が担う。
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && request.nextUrl.pathname.startsWith("/dashboard")) {
    // Redirect to login page if not authenticated
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }
}

// 設定：どのパスで proxy を実行するか
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
