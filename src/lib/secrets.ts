/**
 * Cloudflare Secrets Store バインディングの最小型。
 *
 * `wrangler types` で生成される CloudflareEnv がこのリポジトリには無いため、
 * 必要な部分だけをローカルに宣言する。Secrets Store のバインディングは
 * 通常の env と違い値そのものではなく `.get()` を持つオブジェクトとして渡る。
 */
interface SecretsStoreSecret {
  get(): Promise<string>;
}

/**
 * wrangler.jsonc の `secrets_store_secrets` に定義しているバインディング名。
 * ローカル開発 / `next build` では同名の環境変数にフォールバックする。
 */
type SecretName = "AUTH_SECRET" | "MAIN_SERVER_URL" | "GITHUB_TOKEN";

type SecretsEnv = Partial<Record<SecretName, SecretsStoreSecret | string>>;

/**
 * バインディングから secret を取り出す (文字列 or Secrets Store)。
 */
async function resolveFromEnv(env: SecretsEnv | undefined, name: SecretName) {
  const binding = env?.[name];
  if (typeof binding === "string") {
    return binding;
  }
  if (binding && typeof binding.get === "function") {
    return await binding.get();
  }
  return undefined;
}

/**
 * `cloudflare:workers` を bundler から隠して import する。
 *
 * - vinext (workerd 上で実行) では `cloudflare:workers` が正規の
 *   バインディング取得手段。ただし specifier を静的に書くと Next の
 *   webpack / Turbopack が解決しようとして落ちるため、変数 + ignore
 *   コメントで「実行時までそのまま残す」よう指示する。
 * - Node (next dev / next build) では import 自体が throw し、
 *   `process.env` フォールバックへ進む。
 */
async function importCloudflareWorkers(): Promise<{ env: unknown }> {
  const specifier = "cloudflare:workers";
  return await import(
    /* webpackIgnore: true */ /* @vite-ignore */ specifier
  );
}

/**
 * secret を解決する。
 *
 * 解決順:
 * 1. vinext / workerd 実行時: `cloudflare:workers` の `env` から
 *    Secrets Store バインディング (BSM: morinoparty プロジェクト) を読む。
 * 2. ローカル開発 / `next build` 時: import が失敗するため
 *    `process.env[name]` にフォールバックする。
 *
 * Secrets Store は workerd のグローバルスコープでの非同期 I/O を許可しない
 * ため、モジュールトップレベルではなく呼び出し時に解決する必要がある。
 */
export async function getSecret(name: SecretName): Promise<string | undefined> {
  // 1. vinext / workerd: cloudflare:workers
  try {
    const { env } = await importCloudflareWorkers();
    const secret = await resolveFromEnv(env as SecretsEnv | undefined, name);
    if (secret !== undefined) {
      return secret;
    }
  } catch {
    // workerd 外 (Node) では import が throw する。次へ。
  }

  // 2. ローカル / ビルド時
  return process.env[name];
}
