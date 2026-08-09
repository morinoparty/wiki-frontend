import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins";
import { getSecret } from "./secrets";

// buildAuth の戻り値から型を推論する。better-auth 1.6 以降は betterAuth() が
// 渡したオプションにジェネリックなため、ReturnType<typeof betterAuth> だと
// genericOAuth プラグインのエンドポイント型 (signInWithOAuth2 など) が失われる
type Auth = Awaited<ReturnType<typeof buildAuth>>;

// baseURL(= リクエストの origin)ごとに BetterAuth インスタンスをメモ化する。
// 固定の AUTH_URL を持たないことで、production / preview / ローカル開発の
// どの origin でもそのまま動く
const authCache = new Map<string, Promise<Auth>>();

/**
 * MineAuth の `/oauth2/userinfo` レスポンス。
 * OIDC 標準クレーム (`sub` / `preferred_username` / `picture`) と、
 * 旧実装が参照していた独自クレーム (`id` / `username`) の両方を受け付ける。
 */
interface MineAuthProfile extends Record<string, unknown> {
  sub?: string;
  id?: string;
  username?: string;
  preferred_username?: string;
}

async function buildAuth(baseURL: string) {
  // AUTH_SECRET / MAIN_SERVER_URL は Cloudflare Secrets Store バインディング経由の
  // 非同期読み出しが必要なため、モジュールトップレベルではなく初回リクエスト時に
  // 解決してキャッシュする。
  const [secret, mainServerUrl] = await Promise.all([
    getSecret("AUTH_SECRET"),
    getSecret("MAIN_SERVER_URL"),
  ]);

  // database を渡さない DB-less 構成: セッションと MineAuth のトークンは
  // すべて署名付きクッキーに保存される。Workers の isolate 入れ替えでも
  // ログイン状態が維持される。
  return betterAuth({
    baseURL,
    secret,
    session: {
      // MineAuth の refresh token 寿命 (30日) に合わせる。
      // クッキー内セッションペイロードの expiresAt はこの値で決まり、
      // cookieCache.maxAge より短いとそちらが先に失効してしまう
      expiresIn: 60 * 60 * 24 * 30,
      cookieCache: {
        enabled: true,
        // DB-less ではこの値が session_data クッキーの寿命になる
        // (= 実質のセッション上限)。refresh token と同じ30日
        maxAge: 60 * 60 * 24 * 30,
      },
    },
    account: {
      // MineAuth のトークン一式を account_data クッキーに保存する。
      // access token が切れると getAccessToken が refresh token で
      // 自動更新し、ローテーション後の新 refresh token も書き戻す
      storeAccountCookie: true,
    },
    user: {
      // Minecraft UUID を user レコードに載せるための追加フィールド。
      // better-auth は OAuth プロフィールの `id` を account.accountId にしか
      // 使わず、user.id は自前で採番してしまう。DB-less (メモリアダプタ) では
      // その id がログインのたびに変わり、frontmatter の
      // createdBy / documentOwner / lockedBy と突き合わせられなくなる。
      // そこで UUID を追加フィールドとして持ち回り、下の databaseHooks で
      // user.id そのものに固定する。
      additionalFields: {
        minecraftId: {
          type: "string",
          required: false,
          input: true,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // user 作成直前に id を Minecraft UUID で上書きする。
          // internalAdapter は forceAllowId 付きで create するため、
          // ここで渡した id がそのまま採用される。
          before: async (user) => {
            const minecraftId = user.minecraftId;
            if (typeof minecraftId === "string" && minecraftId.length > 0) {
              return { data: { id: minecraftId } };
            }
          },
        },
      },
    },
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: "MineAuth",
            clientId: process.env.CLIENT_ID as string,
            // token_endpoint_auth_method: "none" のため空文字列
            clientSecret: "",
            pkce: true,
            discoveryUrl: `${mainServerUrl}/.well-known/openid-configuration`,
            scopes: ["openid", "profile", "email"],
            mapProfileToUser: (profile: MineAuthProfile) => {
              const minecraftId = profile.id ?? profile.sub ?? "";
              return {
                id: minecraftId,
                name: profile.username ?? profile.preferred_username,
                image: `https://crafthead.net/avatar/${minecraftId}`,
                minecraftId,
              };
            },
          },
        ],
      }),
      // Next.js の cookies() へ Set-Cookie を転送する公式プラグイン。
      // hooks.after を持つプラグインより後ろ(= 最後)に置く必要がある
      nextCookies(),
    ],
  });
}

/**
 * 現在のリクエストの origin を baseURL としたメモ化済み BetterAuth インスタンスを返す。
 * リクエストコンテキスト内 (Server Component / Server Action / Route Handler) からのみ
 * 呼び出せる。
 */
export async function getAuth(): Promise<Auth> {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const origin = `${proto}://${host}`;

  let auth = authCache.get(origin);
  if (!auth) {
    auth = buildAuth(origin);
    authCache.set(origin, auth);
  }
  return auth;
}

/**
 * 現在のセッションを取得する。未ログインなら null。
 */
export async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}

/** `getSession()` の戻り値型 (better-auth のセッション or null)。 */
export type AppSession = Awaited<ReturnType<typeof getSession>>;
