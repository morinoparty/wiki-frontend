/**
 * Worker の env (cloudflare.config.ts の `worker.env`) から読む値の名前。
 *
 * - `CLIENT_ID`: 通常の var (`bindings.text`)
 * - `AUTH_SECRET` / `SERVER_URL` / `HAGAKI_GITHUB_TOKEN`: Worker secret
 *   (`bindings.secret()`)。deploy 時に `cf deploy --secrets-file` で渡す
 */
export type EnvName =
  | "CLIENT_ID"
  | "AUTH_SECRET"
  | "SERVER_URL"
  | "HAGAKI_GITHUB_TOKEN";

/**
 * env の値を読む。
 *
 * - workerd (`cf dev` / deploy 後) では `cloudflare:workers` の `env` から読む。
 * - Node (検索 index 生成など、Vite を通らないスクリプト) では
 *   `cloudflare:workers` を import できないので `process.env` を読む。
 *
 * `cloudflare:workers` を静的に import すると Node 側で読み込み時に落ちるため、
 * specifier を変数にして実行時まで解決を遅らせる。
 */
export async function getEnv(name: EnvName): Promise<string | undefined> {
  try {
    const specifier = "cloudflare:workers";
    const { env } = (await import(/* @vite-ignore */ specifier)) as {
      env: Partial<Record<EnvName, unknown>>;
    };
    const value = env[name];
    if (typeof value === "string") return value;
  } catch {
    // workerd の外 (Node) では import が失敗する。process.env へ。
  }
  return process.env[name];
}
