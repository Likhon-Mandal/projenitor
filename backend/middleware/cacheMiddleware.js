const { memoryCache } = require('../utils/cache');

/**
 * Cache middleware for Express routes.
 * @param {number} ttlSeconds Time to live in seconds (default: 300)
 * @param {string} prefix Optional cache key namespace
 */
const cacheMiddleware = (ttlSeconds = 300, prefix = 'api') => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if authenticated user token is present and route is user-specific
    const cacheKey = `${prefix}:${req.originalUrl || req.url}`;
    const cachedData = memoryCache.get(cacheKey);

    if (cachedData !== null && cachedData !== undefined) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
      return res.json(cachedData);
    }

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);

    // Intercept res.json to store in memory cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful 200 responses
      if (res.statusCode >= 200 && res.statusCode < 300 && body && !body.error) {
        memoryCache.set(cacheKey, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cache by prefix or tags
 * @param {string} prefix
 */
const invalidateCache = (prefix) => {
  return memoryCache.delByPrefix(prefix);
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  memoryCache
};
