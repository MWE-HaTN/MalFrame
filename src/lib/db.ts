/**
 * IndexedDB async wrapper for MalFrame
 *
 * Stores dashboard data in the 'dashboard' object store.
 * The 'images' store is reserved for future use (currently images are embedded in dashboard JSON).
 *
 * All functions are async and safe to call concurrently — they share a single DB connection promise.
 *
 * Falls back to localStorage when IndexedDB is unavailable (e.g., private browsing).
 */

const DB_NAME = "malframe";
const DB_VERSION = 1;

type StoreName = "dashboard" | "images";

let dbPromise: Promise<IDBDatabase> | null = null;
let _useLocalStorage = false;

/** Returns true if the app is running on the localStorage fallback. */
export function isUsingLocalStorage(): boolean {
  return _useLocalStorage;
}

function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

// --- localStorage fallback helpers ---

const LS_PREFIX = "malframe:idb:";

function lsKey(store: StoreName, key: string): string {
  return `${LS_PREFIX}${store}:${key}`;
}

// --- IndexedDB core ---

function openDB(): Promise<IDBDatabase> {
  if (_useLocalStorage) {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("dashboard")) {
        db.createObjectStore("dashboard");
      }
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => {
      dbPromise = null;
      _useLocalStorage = true; // Set before reject to prevent concurrent retries
      reject(request.error);
    };
  });

  return dbPromise;
}

// --- Exported API ---

export async function dbGet<T>(store: StoreName, key: string): Promise<T | null> {
  if (!isIndexedDBAvailable() || _useLocalStorage) {
    _useLocalStorage = true;
    try {
      const raw = localStorage.getItem(lsKey(store, key));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  let db: IDBDatabase;
  try {
    db = await openDB();
  } catch {
    _useLocalStorage = true;
    try {
      const raw = localStorage.getItem(lsKey(store, key));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function dbSet(store: StoreName, key: string, value: unknown): Promise<void> {
  if (!isIndexedDBAvailable() || _useLocalStorage) {
    _useLocalStorage = true;
    try {
      localStorage.setItem(lsKey(store, key), JSON.stringify(value));
    } catch {
      // Ignore quota errors
    }
    return;
  }

  let db: IDBDatabase;
  try {
    db = await openDB();
  } catch {
    _useLocalStorage = true;
    try {
      localStorage.setItem(lsKey(store, key), JSON.stringify(value));
    } catch {
      // Ignore quota errors
    }
    return;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
  });
}

export async function dbDelete(store: StoreName, key: string): Promise<void> {
  if (!isIndexedDBAvailable() || _useLocalStorage) {
    _useLocalStorage = true;
    try {
      localStorage.removeItem(lsKey(store, key));
    } catch {
      // Ignore
    }
    return;
  }

  let db: IDBDatabase;
  try {
    db = await openDB();
  } catch {
    _useLocalStorage = true;
    try {
      localStorage.removeItem(lsKey(store, key));
    } catch {
      // Ignore
    }
    return;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
  });
}
