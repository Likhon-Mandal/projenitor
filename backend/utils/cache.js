/**
 * High-performance TTL-based in-memory cache with pattern-based invalidation.
 * Designed for serverless and long-running Node.js environments.
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;

    // Periodic sweep for expired items every 60 seconds
    if (typeof setInterval !== 'undefined') {
      const interval = setInterval(() => this.purgeExpired(), 60000);
      if (interval.unref) interval.unref(); // Don't prevent process exit
    }
  }

  /**
   * Get an item from cache
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  /**
   * Set an item in cache with TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds Default: 300 (5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now()
    });
  }

  /**
   * Delete a specific key
   * @param {string} key
   */
  del(key) {
    return this.store.delete(key);
  }

  /**
   * Delete keys matching a prefix or regex pattern
   * Example: delByPrefix('members') or delByPattern(/^members:/)
   * @param {string|RegExp} pattern
   */
  delByPrefix(prefix) {
    let deletedCount = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Purge expired entries
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache telemetry
   */
  getStats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(2) : 0
    };
  }
}

const memoryCache = new MemoryCache();

module.exports = {
  memoryCache,
  MemoryCache
};
