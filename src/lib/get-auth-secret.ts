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

interface AuthEnv {
  AUTH_SECRET?: SecretsStoreSecret | string;
}

/**
 * バインディングから AUTH_SECRET を取り出す (文字列 or Secrets Store)。
 */
async function resolveFromEnv(env: AuthEnv | undefined) {
  const binding = env?.AUTH_SECRET;
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
 *   OpenNext フォールバックへ進む。
 */
async function importCloudflareWorkers(): Promise<{ env: unknown }> {
  const specifier = "cloudflare:workers";
  return await import(
    /* webpackIgnore: true */ /* @vite-ignore */ specifier
  );
}

/**
 * AUTH_SECRET を解決する。
 *
 * 解決順:
 * 1. vinext / workerd 実行時: `cloudflare:workers` の `env` から
 *    Secrets Store バインディング (BSM: shared/AUTH_SECRET) を読む。
 * 2. OpenNext (opennextjs-cloudflare) 実行時: `getCloudflareContext()` の
 *    env から同じバインディングを読む。
 * 3. ローカル開発 / `next build` 時: どちらも失敗するため
 *    `process.env.AUTH_SECRET` にフォールバックする。
 *
 * Secrets Store は workerd のグローバルスコープでの非同期 I/O を許可しない
 * ため、モジュールトップレベルではなく呼び出し時に解決する必要がある。
 */
export async function getAuthSecret(): Promise<string | undefined> {
  // 1. vinext / workerd: cloudflare:workers
  try {
    const { env } = await importCloudflareWorkers();
    const secret = await resolveFromEnv(env as AuthEnv | undefined);
    if (secret !== undefined) {
      return secret;
    }
  } catch {
    // workerd 外 (Node) では import が throw する。次へ。
  }

  // 2. OpenNext: getCloudflareContext
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const secret = await resolveFromEnv(env as AuthEnv | undefined);
    if (secret !== undefined) {
      return secret;
    }
  } catch {
    // Cloudflare ランタイム外 (next build / next dev / テスト) では
    // getCloudflareContext が throw する。フォールバックに進む。
  }

  // 3. ローカル / ビルド時
  return process.env.AUTH_SECRET;
}
