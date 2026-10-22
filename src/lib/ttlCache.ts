/**
 * isolate 内のメモリに置く TTL 付きキャッシュ (サーバー専用)。
 *
 * 旧 vinext の `fetch(..., { next: { revalidate } })` の代わり。workers.dev では
 * Cache API (`caches.default`) が効かないため、isolate が生きている間だけ再利用する。
 */
export function createTtlCache<V>(ttlMs: number, maxEntries = 1000) {
  const entries = new Map<string, { value: V; expiresAt: number }>();
  return {
    get(key: string): V | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: V): void {
      // 上限を超えたら古いものから捨てる (Map は挿入順)
      if (entries.size >= maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}
