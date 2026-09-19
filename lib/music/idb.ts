// Tiny promise wrapper around IndexedDB — no dependencies.
// Stores: audio blobs for local files + small metadata cache.

const DB_NAME = "broke-music-v1";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let req: IDBRequest<T>;
    try {
      req = fn(s);
    } catch (e) {
      db.close();
      return reject(e);
    }
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB request failed"));
    t.oncomplete = () => db.close();
    t.onerror = () => {
      db.close();
      reject(t.error ?? new Error("IDB tx failed"));
    };
  });
}

export async function idbSet(store: "blobs" | "meta", key: string, value: unknown): Promise<void> {
  await tx(store, "readwrite", (s) => s.put(value, key));
}

export async function idbGet<T>(store: "blobs" | "meta", key: string): Promise<T | null> {
  try {
    const v = await tx<T>(store, "readonly", (s) => s.get(key));
    return v ?? null;
  } catch {
    return null;
  }
}

export async function idbDel(store: "blobs" | "meta", key: string): Promise<void> {
  try {
    await tx(store, "readwrite", (s) => s.delete(key));
  } catch {
    /* ignore */
  }
}

export async function idbKeys(store: "blobs" | "meta"): Promise<string[]> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const t = db.transaction(store, "readonly");
      const s = t.objectStore(store);
      const req = s.getAllKeys();
      req.onsuccess = () => {
        db.close();
        resolve((req.result as string[]) ?? []);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}
