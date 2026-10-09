const { pool } = require('../config/db');

// In-memory buffer for high-speed access & offline-DB resilience
const MEMORY_LOG_LIMIT = 200;
const memoryLogs = [];

/**
 * Sanitize sensitive keys like password, token, secret
 */
const sanitizeData = (data) => {
    if (!data || typeof data !== 'object') return data;
    try {
        if (Array.isArray(data)) {
            return data.map(item => sanitizeData(item));
        }
        const cleaned = {};
        for (const [key, value] of Object.entries(data)) {
            if (/password|pass|secret|token|authorization|credential|api_key|private/i.test(key)) {
                cleaned[key] = '[PROTECTED]';
            } else if (typeof value === 'object' && value !== null) {
                cleaned[key] = sanitizeData(value);
            } else {
                cleaned[key] = value;
            }
        }
        return cleaned;
    } catch {
        return '[Unparseable Data]';
    }
};

/**
 * Express Middleware to track all API requests
 */
const apiLogger = (req, res, next) => {
    // Only track API requests
    const url = req.originalUrl || req.url;
    if (!url.startsWith('/api')) {
        return next();
    }

    // Skip self-polling endpoints to prevent infinite noise in logs
    if (url.startsWith('/api/admin/api-logs')) {
        return next();
    }

    const startTime = Date.now();
    let responseBody = null;
    let extractedError = null;

    // Capture response payload
    const originalJson = res.json;
    res.json = function (data) {
        responseBody = data;
        if (res.statusCode >= 400 && data) {
            extractedError = data.error || data.message || data.reason || (typeof data === 'string' ? data : null);
        }
        return originalJson.call(this, data);
    };

    const originalSend = res.send;
    res.send = function (data) {
        if (!responseBody) {
            try {
                responseBody = typeof data === 'string' ? JSON.parse(data) : data;
            } catch {
                responseBody = typeof data === 'string' ? data.slice(0, 500) : null;
            }
        }
        if (res.statusCode >= 400 && !extractedError) {
            if (responseBody && typeof responseBody === 'object') {
                extractedError = responseBody.error || responseBody.message || responseBody.reason || null;
            } else if (typeof data === 'string') {
                extractedError = data.slice(0, 500);
            }
        }
        return originalSend.call(this, data);
    };

    // When response finishes, save log
    res.on('finish', async () => {
        const responseTimeMs = Date.now() - startTime;
        const statusCode = res.statusCode;
        const success = statusCode >= 200 && statusCode < 400;

        // If error status but no error extracted yet, provide standard message
        if (!success && !extractedError) {
            extractedError = `HTTP ${statusCode} ${res.statusMessage || 'Error'}`;
        }

        // Determine user info (req.user populated by auth middleware if authenticated)
        const user = req.user || null;
        const userId = user && user.id ? String(user.id) : null;
        const userEmail = user ? (user.email || user.mobile_number || null) : null;
        const userRole = user ? user.role : (req.headers.authorization ? 'unverified-token' : 'guest');
        const userName = user ? (user.name || user.full_name || null) : null;

        // IP & User Agent
        const ipAddress = req.headers['cf-connecting-ip'] || 
                          req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                          req.socket.remoteAddress || 
                          req.ip || 
                          'Unknown';

        const userAgent = req.headers['user-agent'] || 'Unknown';

        // Prepare clean request & response copies
        const sanitizedQuery = Object.keys(req.query || {}).length > 0 ? sanitizeData(req.query) : null;
        const sanitizedBody = req.body && Object.keys(req.body).length > 0 ? sanitizeData(req.body) : null;
        
        let sanitizedResponse = null;
        if (responseBody) {
            if (typeof responseBody === 'object') {
                sanitizedResponse = sanitizeData(responseBody);
            } else if (typeof responseBody === 'string') {
                sanitizedResponse = { message: responseBody.slice(0, 1000) };
            }
        }

        const logEntry = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            method: req.method,
            endpoint: url,
            status_code: statusCode,
            response_time_ms: responseTimeMs,
            success,
            user_id: userId,
            user_email: userEmail,
            user_role: userRole,
            user_name: userName,
            ip_address: ipAddress,
            user_agent: userAgent,
            query_params: sanitizedQuery,
            request_body: sanitizedBody,
            response_body: sanitizedResponse,
            error_message: extractedError || (success ? 'Success' : 'Unknown Error'),
            error_stack: req.apiErrorStack || null
        };

        // Add to in-memory buffer
        memoryLogs.unshift(logEntry);
        if (memoryLogs.length > MEMORY_LOG_LIMIT) {
            memoryLogs.pop();
        }

        // Persist to PostgreSQL asynchronously (fire & forget, never block or crash)
        try {
            await pool.query(
                `INSERT INTO api_logs (
                    timestamp, method, endpoint, status_code, response_time_ms, success,
                    user_id, user_email, user_role, user_name, ip_address, user_agent,
                    query_params, request_body, response_body, error_message, error_stack
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                [
                    logEntry.timestamp,
                    logEntry.method,
                    logEntry.endpoint,
                    logEntry.status_code,
                    logEntry.response_time_ms,
                    logEntry.success,
                    logEntry.user_id,
                    logEntry.user_email,
                    logEntry.user_role,
                    logEntry.user_name,
                    logEntry.ip_address,
                    logEntry.user_agent,
                    logEntry.query_params ? JSON.stringify(logEntry.query_params) : null,
                    logEntry.request_body ? JSON.stringify(logEntry.request_body) : null,
                    logEntry.response_body ? JSON.stringify(logEntry.response_body) : null,
                    logEntry.error_message,
                    logEntry.error_stack
                ]
            );
        } catch (dbErr) {
            // DB persistence error - memory log will still have it
            console.error('[ApiLogger] Failed to write log to PostgreSQL:', dbErr.message);
        }
    });

    next();
};

/**
 * Return in-memory fallback logs if database is down
 */
const getMemoryLogs = () => memoryLogs;

/**
 * Clear in-memory logs
 */
const clearMemoryLogs = () => {
    memoryLogs.length = 0;
};

module.exports = {
    apiLogger,
    getMemoryLogs,
    clearMemoryLogs
};
