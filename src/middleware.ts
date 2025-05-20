import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";
// export {auth as middleware} from "~/lib/auth";

// APIヘルスチェック用の関数
// async function checkApiHealth() {
//   try {
//     // タイムアウト付きのfetch
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒でタイムアウト

//     const response = await fetch(`${process.env.MAIN_SERVER_URL}`, {
//       signal: controller.signal,
//     });
//     clearTimeout(timeoutId);

//     return response.ok;
//   } catch (error) {
//     console.error("API health check failed:", error);
//     return false;
//   }
// }

export async function middleware(request: NextRequest) {
  // APIの健全性をチェック
  // const isApiHealthy = await checkApiHealth();

  // if (!isApiHealthy) {
  //   // APIが応答しない場合は503エラーページにリダイレクト
  //   return NextResponse.redirect(new URL("/service-unavailable", request.url));
  // }

  // 通常の認証処理を実行
  const response = await auth();

  if (!response?.user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // Redirect to login page if not authenticated
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }
}

// 設定：どのパスでミドルウェアを実行するか
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|moripa.svg).*)"],
};
