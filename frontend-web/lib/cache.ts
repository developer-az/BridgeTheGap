type CacheEntry<T> = {
  value: T;
  expires: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value as T;
  }

  const value = await fn();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export function cacheKey(parts: Array<string | number | undefined | null>): string {
  return parts.map((part) => String(part ?? '').trim().toLowerCase()).join('|');
}
