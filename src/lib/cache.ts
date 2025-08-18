/**
 * Advanced caching and memoization utilities
 * Provides multiple caching strategies for optimal performance
 */

import { LRUCache } from 'lru-cache';

// Types
interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  max?: number; // Maximum number of items
  updateAgeOnGet?: boolean; // Refresh TTL on access
  stale?: boolean; // Allow stale data while revalidating
}

interface MemoOptions extends CacheOptions {
  key?: (...args: any[]) => string; // Custom key generator
  serialize?: boolean; // Serialize complex objects
}

/**
 * In-memory LRU cache with TTL support
 */
class MemoryCache<T = any> {
  private cache: LRUCache<string, any>;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache<string, any>({
      max: options.max || 500,
      ttl: options.ttl || 1000 * 60 * 5, // 5 minutes default
      updateAgeOnGet: options.updateAgeOnGet ?? true,
      allowStale: options.stale ?? false,
    });
  }

  get(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value as any, { ttl });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    return Array.from(this.cache.values()) as T[];
  }

  entries(): Array<[string, T]> {
    return Array.from(this.cache.entries()) as Array<[string, T]>;
  }

  prune(): void {
    this.cache.purgeStale();
  }
}

/**
 * SessionStorage cache for browser persistence
 */
class SessionCache {
  private prefix = 'cache:';

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = sessionStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const { value, expiry } = JSON.parse(item);
      if (expiry && Date.now() > expiry) {
        sessionStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return value;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (typeof window === 'undefined') return;
    
    try {
      const item = {
        value,
        expiry: ttl ? Date.now() + ttl : null,
      };
      sessionStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) {
      // Handle quota exceeded
      if (e instanceof DOMException && e.code === 22) {
        this.clear();
        // Retry once after clearing
        try {
          sessionStorage.setItem(this.prefix + key, JSON.stringify({ value, expiry: ttl ? Date.now() + ttl : null }));
        } catch {}
      }
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

/**
 * LocalStorage cache for persistent browser storage
 */
class LocalCache {
  private prefix = 'cache:';

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const { value, expiry } = JSON.parse(item);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return value;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (typeof window === 'undefined') return;
    
    try {
      const item = {
        value,
        expiry: ttl ? Date.now() + ttl : null,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) {
      // Handle quota exceeded
      if (e instanceof DOMException && e.code === 22) {
        this.clear();
        // Retry once after clearing
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify({ value, expiry: ttl ? Date.now() + ttl : null }));
        } catch {}
      }
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  size(): number {
    if (typeof window === 'undefined') return 0;
    
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        size += localStorage.getItem(key)?.length || 0;
      }
    });
    return size;
  }
}

/**
 * IndexedDB cache for large data storage
 */
class IndexedDBCache {
  private dbName = 'AppCache';
  private storeName = 'cache';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (result.expiry && Date.now() > result.expiry) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(result.value);
      };
    });
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({
        key,
        value,
        expiry: ttl ? Date.now() + ttl : null,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async prune(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiry');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
}

/**
 * Memoization decorator for functions
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoOptions = {}
): T {
  const cache = new MemoryCache(options);
  const keyGenerator = options.key || ((...args) => JSON.stringify(args));

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    
    // Handle promises
    if (result && typeof result.then === 'function') {
      return result.then((value: any) => {
        cache.set(key, value, options.ttl);
        return value;
      }).catch((error: any) => {
        // Don't cache errors
        cache.delete(key);
        throw error;
      });
    }

    cache.set(key, result, options.ttl);
    return result;
  }) as T;
}

/**
 * Debounce decorator
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle decorator
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  }) as T;
}

/**
 * Batch processor for aggregating multiple calls
 */
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private processor: (batch: T[]) => Promise<R[]>,
    private delay = 10,
    private maxSize = 100
  ) {}

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);

      if (this.batch.length >= this.maxSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delay);
      }

      // Store resolve/reject for later
      const index = this.batch.length - 1;
      (item as any).__resolve = resolve;
      (item as any).__reject = reject;
      (item as any).__index = index;
    });
  }

  private async flush(): Promise<void> {
    if (this.processing || this.batch.length === 0) return;

    this.processing = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      const results = await this.processor(currentBatch);
      
      currentBatch.forEach((item, index) => {
        const resolve = (item as any).__resolve;
        if (resolve) {
          resolve(results[index]);
        }
      });
    } catch (error) {
      currentBatch.forEach((item) => {
        const reject = (item as any).__reject;
        if (reject) {
          reject(error);
        }
      });
    } finally {
      this.processing = false;
    }
  }
}

// Create singleton instances
export const memoryCache = new MemoryCache();
export const sessionCache = new SessionCache();
export const localCache = new LocalCache();
export const idbCache = new IndexedDBCache();

// Export classes for custom instances
export { MemoryCache, SessionCache, LocalCache, IndexedDBCache };
