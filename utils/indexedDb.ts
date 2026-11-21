import { Database } from '../types';

// IndexedDB-backed local backup. Unlike localStorage (which is limited to ~5MB
// and synchronous), this scales to large financial datasets and avoids blocking
// the main thread during read/write of the full database snapshot.

const DB_NAME = 'goft3-db';
const STORE_NAME = 'backup';
const BACKUP_KEY = 'goft3_local_backup';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    return dbPromise;
};

export const saveBackupToIndexedDb = async (data: Database): Promise<void> => {
    try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(JSON.stringify(data), BACKUP_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        // Fall back to localStorage if IndexedDB is unavailable (e.g. private mode)
        try {
            localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
        } catch {
            console.error("Failed to save local backup (IndexedDB and localStorage)", e);
        }
    }
};

export const loadBackupFromIndexedDb = async (): Promise<Database | null> => {
    try {
        const db = await openDb();
        const raw = await new Promise<string | null>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).get(BACKUP_KEY);
            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject(request.error);
        });
        if (raw) {
            return JSON.parse(raw) as Database;
        }
        // Fall back to legacy localStorage backup (pre-IndexedDB)
        const legacy = localStorage.getItem(BACKUP_KEY);
        if (legacy) {
            return JSON.parse(legacy) as Database;
        }
        return null;
    } catch (e) {
        console.error("Failed to load local backup from IndexedDB", e);
        try {
            const legacy = localStorage.getItem(BACKUP_KEY);
            if (legacy) return JSON.parse(legacy) as Database;
        } catch {
            // ignore
        }
        return null;
    }
};

export const clearBackupFromIndexedDb = async (): Promise<void> => {
    try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(BACKUP_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.warn("Failed to clear IndexedDB backup", e);
    }
    try {
        localStorage.removeItem(BACKUP_KEY);
    } catch {
        // ignore
    }
};
