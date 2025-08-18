/**
 * Centralized API Hub with advanced features:
 * - Connection pooling and reuse
 * - Automatic retry logic with exponential backoff
 * - Request deduplication
 * - Response caching with TTL
 * - SSE connection management
 * - Request queuing and batching
 * - Optimistic updates
 * - Error boundary integration
 */

import { subscribeSharedSSE } from './sseLeader';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiRequestConfig {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  retry?: RetryConfig;
  dedupe?: boolean;
  cacheTTL?: number;
  optimistic?: OptimisticUpdate;
  priority?: 'high' | 'normal' | 'low';
}

interface RetryConfig {
  maxAttempts?: number;
  backoffMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

interface OptimisticUpdate {
  data: any;
  rollback?: () => void;
}

interface CachedResponse {
  data: any;
  timestamp: number;
  ttl: number;
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

interface QueuedRequest {
  url: string;
  config: ApiRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
}

class ApiHub {
  private static instance: ApiHub;
  private responseCache = new Map<string, CachedResponse>();
  private pendingRequests = new Map<string, PendingRequest>();
  private sseConnections = new Map<string, () => void>();
  private requestQueue: QueuedRequest[] = [];
  private processing = false;
  private csrfToken: string | null = null;
  private activeConnections = 0;
  private maxConcurrentConnections = 6; // Browser limit
  private requestStats = {
    total: 0,
    cached: 0,
    deduped: 0,
    failed: 0,
    retried: 0,
  };

  private constructor() {
    // Initialize CSRF token
    this.initializeCsrf();
    
    // Start queue processor
    this.startQueueProcessor();
    
    // Cleanup old cache entries periodically
    setInterval(() => this.cleanupCache(), 60000);
    
    // Monitor connection health
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('offline', () => this.pauseQueue());
    }
  }

  static getInstance(): ApiHub {
    if (!ApiHub.instance) {
      ApiHub.instance = new ApiHub();
    }
    return ApiHub.instance;
  }

  private async initializeCsrf() {
    try {
      const res = await fetch('/api/csrf', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this.csrfToken = data.token;
      }
    } catch {
      // CSRF not available, will retry on first request
    }
  }

  /**
   * Main request method with all optimizations
   */
  async request<T = any>(url: string, config: ApiRequestConfig = {}): Promise<T> {
    this.requestStats.total++;

    // Check cache first for GET requests
    if ((!config.method || config.method === 'GET') && config.dedupe !== false) {
      const cached = this.getCachedResponse(url);
      if (cached) {
        this.requestStats.cached++;
        return cached;
      }
    }

    // Check for pending duplicate requests
    if (config.dedupe !== false) {
      const pending = this.getPendingRequest(url, config);
      if (pending) {
        this.requestStats.deduped++;
        return pending;
      }
    }

    // Apply optimistic update if provided
    if (config.optimistic) {
      this.applyOptimisticUpdate(url, config.optimistic);
    }

    // Queue request if connection limit reached
    if (this.activeConnections >= this.maxConcurrentConnections) {
      return this.queueRequest(url, config);
    }

    // Execute request with retry logic
    return this.executeRequest<T>(url, config);
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest<T>(url: string, config: ApiRequestConfig): Promise<T> {
    const requestKey = this.getRequestKey(url, config);
    const retryConfig: RetryConfig = {
      maxAttempts: 3,
      backoffMs: 1000,
      backoffMultiplier: 2,
      shouldRetry: (error, attempt) => {
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) return false;
        // Retry on network errors or server errors
        return attempt < 3;
      },
      ...config.retry
    };

    let lastError: any;
    let attempt = 0;

    const executeAttempt = async (): Promise<T> => {
      this.activeConnections++;
      
      try {
        // Prepare headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...config.headers,
        };

        // Add CSRF token for mutating requests
        if (config.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
          if (!this.csrfToken) {
            await this.initializeCsrf();
          }
          if (this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken;
          }
        }

        // Create request promise
        const requestPromise = fetch(url, {
          method: config.method || 'GET',
          headers,
          body: config.body ? JSON.stringify(config.body) : undefined,
          credentials: config.credentials || 'include',
          cache: config.cache || 'no-store',
          signal: config.signal,
        }).then(async (response) => {
          if (!response.ok) {
            const error = await this.parseError(response);
            throw error;
          }
          return response.json();
        });

        // Store as pending request
        this.pendingRequests.set(requestKey, {
          promise: requestPromise,
          timestamp: Date.now(),
        });

        const data = await requestPromise;

        // Cache successful GET responses
        if ((!config.method || config.method === 'GET') && config.cacheTTL !== 0) {
          this.setCachedResponse(url, data, config.cacheTTL || 60000);
        }

        return data as T;
      } catch (error) {
        lastError = error;
        attempt++;
        this.requestStats.failed++;

        // Check if should retry
        if (retryConfig.shouldRetry?.(error, attempt) && attempt < retryConfig.maxAttempts!) {
          this.requestStats.retried++;
          const delay = retryConfig.backoffMs! * Math.pow(retryConfig.backoffMultiplier!, attempt - 1);
          await this.delay(delay);
          return executeAttempt();
        }

        // Rollback optimistic update on final failure
        if (config.optimistic?.rollback) {
          config.optimistic.rollback();
        }

        throw lastError;
      } finally {
        this.activeConnections--;
        this.pendingRequests.delete(requestKey);
        this.processQueue();
      }
    };

    return executeAttempt();
  }

  /**
   * GET request helper
   */
  async get<T = any>(url: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request helper
   */
  async post<T = any>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  /**
   * PUT request helper
   */
  async put<T = any>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(url: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request helper
   */
  async patch<T = any>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  /**
   * Subscribe to SSE stream with automatic reconnection
   */
  subscribeSSE(url: string, handler: (event: any) => void): () => void {
    // Check if already subscribed
    const existingUnsubscribe = this.sseConnections.get(url);
    if (existingUnsubscribe) {
      console.warn(`Already subscribed to SSE: ${url}`);
      return existingUnsubscribe;
    }

    // Create subscription with shared SSE leader
    const unsubscribe = subscribeSharedSSE(url, handler);
    
    // Store unsubscribe function
    this.sseConnections.set(url, unsubscribe);

    // Return cleanup function
    return () => {
      unsubscribe();
      this.sseConnections.delete(url);
    };
  }

  /**
   * Batch multiple requests
   */
  async batch<T extends any[]>(requests: Array<{ url: string; config?: ApiRequestConfig }>): Promise<T> {
    return Promise.all(
      requests.map(({ url, config }) => this.request(url, config))
    ) as Promise<T>;
  }

  /**
   * Request with automatic pagination
   */
  async *paginate<T = any>(
    urlPattern: string,
    pageSize = 20,
    maxPages = Infinity
  ): AsyncGenerator<T[], void, unknown> {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      const url = urlPattern.replace('{page}', String(page));
      const response = await this.get<{ items: T[]; total: number }>(url);
      
      yield response.items;
      
      hasMore = response.items.length === pageSize;
      page++;
    }
  }

  /**
   * Cache management
   */
  private getCachedResponse(url: string): any | null {
    const cached = this.responseCache.get(url);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.responseCache.delete(url);
      return null;
    }

    return cached.data;
  }

  private setCachedResponse(url: string, data: any, ttl: number) {
    this.responseCache.set(url, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clearCache(urlPattern?: string) {
    if (!urlPattern) {
      this.responseCache.clear();
      return;
    }

    for (const [url] of this.responseCache) {
      if (url.includes(urlPattern)) {
        this.responseCache.delete(url);
      }
    }
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [url, cached] of this.responseCache) {
      if (now - cached.timestamp > cached.ttl) {
        this.responseCache.delete(url);
      }
    }
  }

  /**
   * Request deduplication
   */
  private getPendingRequest(url: string, config: ApiRequestConfig): Promise<any> | null {
    // Only dedupe GET requests
    if (config.method && config.method !== 'GET') return null;

    const key = this.getRequestKey(url, config);
    const pending = this.pendingRequests.get(key);
    
    if (!pending) return null;

    // Check if request is still fresh (< 5 seconds old)
    if (Date.now() - pending.timestamp > 5000) {
      this.pendingRequests.delete(key);
      return null;
    }

    return pending.promise;
  }

  private getRequestKey(url: string, config: ApiRequestConfig): string {
    return `${config.method || 'GET'}:${url}`;
  }

  /**
   * Request queueing
   */
  private queueRequest<T>(url: string, config: ApiRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      const priority = config.priority === 'high' ? 0 : config.priority === 'low' ? 2 : 1;
      
      this.requestQueue.push({
        url,
        config,
        resolve,
        reject,
        priority,
      });

      // Sort by priority
      this.requestQueue.sort((a, b) => a.priority - b.priority);
    });
  }

  private startQueueProcessor() {
    setInterval(() => this.processQueue(), 100);
  }

  private processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;
    if (this.activeConnections >= this.maxConcurrentConnections) return;
    if (typeof window !== 'undefined' && !navigator.onLine) return;

    this.processing = true;

    const available = this.maxConcurrentConnections - this.activeConnections;
    const toProcess = this.requestQueue.splice(0, available);

    for (const request of toProcess) {
      this.executeRequest(request.url, request.config)
        .then(request.resolve)
        .catch(request.reject);
    }

    this.processing = false;
  }

  private pauseQueue() {
    console.log('ApiHub: Queue paused (offline)');
  }

  /**
   * Optimistic updates
   */
  private applyOptimisticUpdate(url: string, optimistic: OptimisticUpdate) {
    // Store optimistic data in cache temporarily
    this.setCachedResponse(url, optimistic.data, 5000);
  }

  /**
   * Error handling
   */
  private async parseError(response: Response): Promise<Error> {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const data = await response.json();
      if (data.error) message = data.error;
      else if (data.message) message = data.message;
    } catch {
      // Response wasn't JSON
    }

    const error: any = new Error(message);
    error.status = response.status;
    error.statusText = response.statusText;
    return error;
  }

  /**
   * Utilities
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.requestStats,
      cacheSize: this.responseCache.size,
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.length,
      activeConnections: this.activeConnections,
      sseConnections: this.sseConnections.size,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.requestStats = {
      total: 0,
      cached: 0,
      deduped: 0,
      failed: 0,
      retried: 0,
    };
  }
}

// Export singleton instance
export const apiHub = ApiHub.getInstance();

// Export types
export type { ApiRequestConfig, RetryConfig, OptimisticUpdate };
