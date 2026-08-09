import { getCloudflareContext } from "@opennextjs/cloudflare";

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
 * AUTH_SECRET を解決する。
 *
 * - Cloudflare (OpenNext) 実行時: Secrets Store バインディング
 *   (BSM: shared/AUTH_SECRET) から非同期の `.get()` で読み出す。
 *   Secrets Store は workerd のグローバルスコープでの非同期 I/O を許可しないため、
 *   モジュールトップレベルではなく呼び出し時に解決する必要がある。
 * - ローカル開発 / `next build` 時: Cloudflare コンテキストが存在しないため
 *   `process.env.AUTH_SECRET` にフォールバックする。
 */
export async function getAuthSecret(): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const binding = (env as AuthEnv | undefined)?.AUTH_SECRET;

    if (typeof binding === "string") {
      return binding;
    }
    if (binding && typeof binding.get === "function") {
      return await binding.get();
    }
  } catch {
    // Cloudflare ランタイム外 (next build / next dev / テスト) では
    // getCloudflareContext が throw する。フォールバックに進む。
  }

  return process.env.AUTH_SECRET;
}
