const rateLimit = require('express-rate-limit');

// Helper to extract true client IP behind Reverse Proxies (Cloudflare, Vercel, Nginx, AWS)
const getClientIp = (req) => {
    return req.headers['cf-connecting-ip'] || 
           req.headers['x-real-ip'] || 
           (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
           req.ip;
};

// Global API rate limiter (protects API gateway endpoints from scraping and DDoS)
const apiLimiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIp,
    validate: { keyGeneratorIpFallback: false },
    message: {
        error: 'Too Many Requests',
        message: 'অনুরোধের সীমা অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন। (Too many requests, please try again later.)'
    }
});

// Strict rate limiter for Auth & Sensitive endpoints (prevents brute-force & credential stuffing)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 25, // 25 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIp,
    validate: { keyGeneratorIpFallback: false },
    message: {
        error: 'Too Many Attempts',
        message: 'অতিরিক্ত লগইন বা অনুরোধ প্রচেষ্টার কারণে সাময়িকভাবে স্থগিত। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।'
    }
});

module.exports = {
    apiLimiter,
    authLimiter
};
