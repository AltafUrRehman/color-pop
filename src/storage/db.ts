// Tiny IndexedDB key-value store. Everything stays on the device.
// Falls back to memory if IndexedDB is unavailable (e.g. some embedded previews).

const mem = new Map<string, unknown>();
let dbp: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (!dbp) {
    dbp = new Promise((resolve) => {
      // some sandboxed or embedded frames never answer: fall back to memory instead of waiting forever
      const giveUp = setTimeout(() => resolve(null), 2000);
      const done = (db: IDBDatabase | null) => {
        clearTimeout(giveUp);
        resolve(db);
      };
      try {
        const req = indexedDB.open('color-pop', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv');
        req.onsuccess = () => done(req.result);
        req.onerror = () => done(null);
        req.onblocked = () => done(null);
      } catch {
        done(null);
      }
    });
  }
  return dbp;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const req = fn(db.transaction('kv', mode).objectStore('kv'));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      }),
  );
}

export async function get<T>(key: string): Promise<T | undefined> {
  const db = await open();
  if (!db) return mem.get(key) as T | undefined;
  return tx<T>('readonly', (s) => s.get(key) as IDBRequest<T>);
}

export async function set(key: string, value: unknown): Promise<void> {
  const db = await open();
  if (!db) {
    mem.set(key, value);
    return;
  }
  await tx('readwrite', (s) => s.put(value, key));
}

export async function del(key: string): Promise<void> {
  const db = await open();
  if (!db) {
    mem.delete(key);
    return;
  }
  await tx('readwrite', (s) => s.delete(key));
}

/** all [key, value] pairs whose key starts with prefix */
export async function entries<T>(prefix: string): Promise<[string, T][]> {
  const db = await open();
  if (!db) return [...mem].filter(([k]) => k.startsWith(prefix)) as [string, T][];
  const range = IDBKeyRange.bound(prefix, prefix + '￿');
  const [keys, values] = await Promise.all([
    tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys(range)),
    tx<T[]>('readonly', (s) => s.getAll(range) as IDBRequest<T[]>),
  ]);
  if (!keys || !values) return [];
  return keys.map((k, i) => [String(k), values[i]]);
}

/** ask the browser not to evict our data under storage pressure (installed apps usually get this) */
export function persist() {
  try {
    navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    /* ignore */
  }
}

/** delete every key that starts with prefix */
export async function delPrefix(prefix: string): Promise<void> {
  const keys = (await entries<unknown>(prefix)).map(([k]) => k);
  for (const k of keys) await del(k);
}
