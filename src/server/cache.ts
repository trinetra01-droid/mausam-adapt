import Redis from 'ioredis';

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  ttlMs: number;
  swrMs: number; // Stale-while-revalidate window
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  cooldownPeriodMs: number;
  successThreshold: number;
}

export class CircuitBreaker {
  public state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();

  constructor(
    public name: string,
    public options: CircuitBreakerOptions = {
      failureThreshold: 5,
      cooldownPeriodMs: 30000,
      successThreshold: 2
    }
  ) {}

  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    // HALF_OPEN
    return true;
  }

  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.options.cooldownPeriodMs;
      console.warn(`[CircuitBreaker] Circuit for ${this.name} tripped to OPEN. Next attempt at ${new Date(this.nextAttempt).toISOString()}`);
    }
  }
}

export class ResilientCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private inFlightRequests = new Map<string, Promise<any>>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private redisClient: Redis | null = null;
  private isRedisConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && !redisUrl.includes('localhost:6379')) {
      try {
        this.redisClient = new Redis(redisUrl, {
          connectTimeout: 2000,
          maxRetriesPerRequest: 1,
          lazyConnect: true
        });
        this.redisClient.connect()
          .then(() => {
            this.isRedisConnected = true;
            console.log('[Cache] Connected to remote Redis cache instance.');
          })
          .catch((err) => {
            console.warn('[Cache] Remote Redis connection failed, using high-performance in-memory cache with SWR.', err.message);
          });
      } catch (err: any) {
        console.warn('[Cache] Could not init Redis, using resilient in-memory cache.', err.message);
      }
    } else {
      console.log('[Cache] Using self-hosted in-memory cache with TTL, SWR, deduplication, and circuit breakers.');
    }
  }

  getCircuitBreaker(name: string): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name));
    }
    return this.circuitBreakers.get(name)!;
  }

  async get<T>(key: string): Promise<{ data: T; isStale: boolean } | null> {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.createdAt;
    if (age <= entry.ttlMs) {
      return { data: entry.data, isStale: false };
    } else if (age <= entry.ttlMs + entry.swrMs) {
      return { data: entry.data, isStale: true };
    }
    // Expired beyond SWR
    this.memoryCache.delete(key);
    return null;
  }

  async set<T>(key: string, data: T, ttlSeconds: number = 300, swrSeconds: number = 600): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      createdAt: Date.now(),
      ttlMs: ttlSeconds * 1000,
      swrMs: swrSeconds * 1000
    };
    this.memoryCache.set(key, entry);

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds + swrSeconds);
      } catch (e) {
        // Silently tolerate redis sync error
      }
    }
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (e) {}
    }
  }

  async invalidatePattern(prefix: string): Promise<void> {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Fetch with Stale-While-Revalidate and Request Deduplication
   */
  async fetchWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300,
    swrSeconds: number = 900
  ): Promise<{ data: T; isStale: boolean }> {
    const cached = await this.get<T>(key);

    if (cached) {
      if (!cached.isStale) {
        return cached;
      }
      // Data is stale, trigger async revalidation in the background
      this.revalidateInBackground(key, fetcher, ttlSeconds, swrSeconds);
      return cached;
    }

    // Not in cache, use request deduplication
    if (this.inFlightRequests.has(key)) {
      const data = await this.inFlightRequests.get(key)!;
      return { data, isStale: false };
    }

    const requestPromise = (async () => {
      try {
        const fresh = await fetcher();
        await this.set(key, fresh, ttlSeconds, swrSeconds);
        return fresh;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, requestPromise);
    const result = await requestPromise;
    return { data: result, isStale: false };
  }

  private revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    swrSeconds: number
  ): void {
    if (this.inFlightRequests.has(key)) return;

    const requestPromise = (async () => {
      try {
        const fresh = await fetcher();
        await this.set(key, fresh, ttlSeconds, swrSeconds);
      } catch (err: any) {
        console.warn(`[Cache] Background revalidation failed for ${key}:`, err.message);
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, requestPromise);
  }

  /**
   * Execute an operation with circuit breaker and exponential backoff retry
   */
  async executeWithResilience<T>(
    breakerName: string,
    operation: () => Promise<T>,
    maxRetries: number = 2,
    baseDelayMs: number = 500
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(breakerName);

    if (!breaker.canExecute()) {
      throw new Error(`Circuit breaker for ${breakerName} is OPEN. Service call suppressed to prevent cascade.`);
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const result = await operation();
        breaker.recordSuccess();
        return result;
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          breaker.recordFailure();
          throw err;
        }
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Exhausted retry attempts');
  }

  getStats() {
    return {
      memoryEntries: this.memoryCache.size,
      inFlightCount: this.inFlightRequests.size,
      isRedisConnected: this.isRedisConnected,
      circuits: Array.from(this.circuitBreakers.entries()).map(([name, b]) => ({
        name,
        state: b.state
      }))
    };
  }
}

export const cache = new ResilientCacheManager();
