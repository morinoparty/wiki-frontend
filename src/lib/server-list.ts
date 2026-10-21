import { z } from "zod";
import { getEnv } from "./env";

// `${SERVER_URL}servers` が返すサーバー識別子の配列 (例: ["main", "res", "lobby"])
const serverListSchema = z.array(z.string().min(1));

// サーバーリスト・認証サーバーの解決結果を isolate 内でキャッシュする期間。
// サーバー構成はめったに変わらないため、リクエストごとの余計な往復を避ける
const CACHE_TTL_MS = 60 * 1000;

type Cached<T> = { value: Promise<T>; expiresAt: number };

let serverListCache: Cached<string[]> | undefined;
let authServerCache: Cached<string> | undefined;

/**
 * SERVER_URL を末尾スラッシュ付きに正規化したベース URL を返す。
 * Secret の値が `https://api.morino.party` でも `https://api.morino.party/` でも動くようにする
 */
async function getBaseUrl(): Promise<string> {
  const serverUrl = await getEnv("SERVER_URL");
  if (!serverUrl) {
    throw new Error("SERVER_URL が設定されていません");
  }
  return serverUrl.endsWith("/") ? serverUrl : `${serverUrl}/`;
}

/**
 * サーバー識別子から、そのサーバーの API ベース URL (末尾スラッシュなし) を組み立てる
 */
export async function getServerUrl(server: string): Promise<string> {
  return `${await getBaseUrl()}${server}`;
}

async function fetchServerList(): Promise<string[]> {
  const response = await fetch(`${await getBaseUrl()}servers`);
  if (!response.ok) {
    throw new Error(`サーバーリストの取得に失敗しました: ${response.status}`);
  }
  // 想定外のレスポンス形式は Zod で弾く
  return serverListSchema.parse(await response.json());
}

/**
 * `${SERVER_URL}servers` からサーバー識別子の一覧を取得する (並び順は API のまま)
 */
export function getServers(): Promise<string[]> {
  const now = Date.now();
  if (!serverListCache || serverListCache.expiresAt <= now) {
    const value = fetchServerList();
    // 失敗した Promise をキャッシュし続けないよう、エラー時はキャッシュを破棄する
    value.catch(() => {
      if (serverListCache?.value === value) {
        serverListCache = undefined;
      }
    });
    serverListCache = { value, expiresAt: now + CACHE_TTL_MS };
  }
  return serverListCache.value;
}

async function resolveAuthServerUrl(): Promise<string> {
  const servers = await getServers();
  // リストの上から順に OIDC discovery が応答するサーバーを探し、最初に見つかったものを認証サーバーにする
  for (const server of servers) {
    const serverUrl = await getServerUrl(server);
    try {
      const response = await fetch(
        `${serverUrl}/.well-known/openid-configuration`,
      );
      if (response.ok) {
        return serverUrl;
      }
    } catch (error) {
      // ネットワークエラーなどは次のサーバーへフォールバックする
      console.warn(`認証サーバー候補 ${server} に接続できません:`, error);
    }
  }
  throw new Error("利用可能な認証サーバーが見つかりません");
}

/**
 * 認証サーバー (MineAuth) の API ベース URL を返す。
 * サーバーリストの上から順に試し、応答した最初のサーバーを採用する
 */
export function getAuthServerUrl(): Promise<string> {
  const now = Date.now();
  if (!authServerCache || authServerCache.expiresAt <= now) {
    const value = resolveAuthServerUrl();
    // 失敗した Promise をキャッシュし続けないよう、エラー時はキャッシュを破棄する
    value.catch(() => {
      if (authServerCache?.value === value) {
        authServerCache = undefined;
      }
    });
    authServerCache = { value, expiresAt: now + CACHE_TTL_MS };
  }
  return authServerCache.value;
}
