import { getRequest } from "@tanstack/react-start/server";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import {
  genericOAuth,
  type GenericOAuthUserInfo,
} from "better-auth/plugins/generic-oauth";
import { getEnv } from "./env";
import { getRequestOrigin } from "./request-origin";
import { getAuthServerUrl } from "./server-list";

// buildAuth の戻り値から型を推論する。better-auth 1.6 以降は betterAuth() が
// 渡したオプションにジェネリックなため、ReturnType<typeof betterAuth> だと
// genericOAuth プラグインのエンドポイント型 (signInWithOAuth2 など) が失われる
type Auth = Awaited<ReturnType<typeof buildAuth>>;

// baseURL(= リクエストの origin)と認証サーバーの組ごとに BetterAuth インスタンスを
// メモ化する。固定の AUTH_URL を持たないことで、production / preview / ローカル開発の
// どの origin でもそのまま動く。認証サーバーがフォールバックで切り替わった場合は
// 別インスタンスを作り直す
const authCache = new Map<string, Promise<Auth>>();

/** 文字列か数値のクレームを文字列にそろえる (null / 未設定は undefined)。 */
function claim(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}

/**
 * MineAuth の `/oauth2/userinfo` から Minecraft UUID を取り出す。OIDC 標準の
 * `sub` と、旧実装の独自クレーム `id` の両方を受け付ける。
 */
function minecraftIdOf(profile: GenericOAuthUserInfo): string {
  return claim(profile.id) ?? claim(profile.sub) ?? "";
}

async function buildAuth(baseURL: string, authServerUrl: string) {
  // Worker の env はリクエスト処理中に読む (モジュール初期化時ではなく、
  // 初回リクエストで解決してインスタンスごとキャッシュする)。
  const [secret, clientId] = await Promise.all([
    getEnv("AUTH_SECRET"),
    getEnv("CLIENT_ID"),
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
            clientId: clientId ?? "",
            // public client (token_endpoint_auth_method: "none") + PKCE のため空文字列
            clientSecret: "",
            tokenEndpointAuth: { method: "none" },
            pkce: true,
            // サーバーリストの上から順に解決した認証サーバーの discovery を使う
            discoveryUrl: `${authServerUrl}/.well-known/openid-configuration`,
            scopes: ["openid", "profile", "email"],
            // アカウントの同一性も Minecraft UUID で持つ
            accountSubject: ({ profile }) => minecraftIdOf(profile),
            // `preferred_username` (OIDC) と `username` (旧実装) の両方を受け付ける
            mapProfileToUser: (profile: GenericOAuthUserInfo) => {
              const minecraftId = minecraftIdOf(profile);
              return {
                name:
                  claim(profile.username) ?? claim(profile.preferred_username),
                image: `https://crafthead.net/avatar/${minecraftId}`,
                minecraftId,
              };
            },
          },
        ],
      }),
      // server function から呼んだ API の Set-Cookie をレスポンスへ転送する
      // 公式プラグイン。hooks.after を持つプラグインより後ろ(= 最後)に置く必要がある
      tanstackStartCookies(),
    ],
  });
}

/**
 * 現在のリクエストの origin を baseURL としたメモ化済み BetterAuth インスタンスを返す。
 * リクエストコンテキスト内 (server function / server route / SSR の loader) からのみ
 * 呼び出せる。
 */
export async function getAuth(): Promise<Auth> {
  const origin = getRequestOrigin();
  const authServerUrl = await getAuthServerUrl();
  const cacheKey = `${origin}|${authServerUrl}`;

  let auth = authCache.get(cacheKey);
  if (!auth) {
    auth = buildAuth(origin, authServerUrl);
    authCache.set(cacheKey, auth);
  }
  return auth;
}

/**
 * 現在のセッションを取得する。未ログインなら null。
 */
export async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: getRequest().headers });
}

/** `getSession()` の戻り値型 (better-auth のセッション or null)。 */
export type AppSession = Awaited<ReturnType<typeof getSession>>;
