const { pool } = require('../config/db');
const { getMemoryLogs, clearMemoryLogs } = require('../middleware/apiLogger');

/**
 * Controller to manage & inspect API Audit Logs for SuperAdmin
 */
exports.getApiLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = (page - 1) * limit;

        const { search, status, method, timeRange } = req.query;

        // Build WHERE clauses
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (search && search.trim()) {
            const searchVal = `%${search.trim()}%`;
            conditions.push(`(
                endpoint ILIKE $${paramIndex} OR 
                COALESCE(error_message, '') ILIKE $${paramIndex} OR 
                COALESCE(user_email, '') ILIKE $${paramIndex} OR 
                COALESCE(user_name, '') ILIKE $${paramIndex} OR 
                COALESCE(ip_address, '') ILIKE $${paramIndex}
            )`);
            values.push(searchVal);
            paramIndex++;
        }

        if (status && status !== 'all') {
            if (status === 'success') {
                conditions.push(`success = true`);
            } else if (status === 'error') {
                conditions.push(`success = false`);
            } else if (status === '2xx') {
                conditions.push(`status_code >= 200 AND status_code < 300`);
            } else if (status === '4xx') {
                conditions.push(`status_code >= 400 AND status_code < 500`);
            } else if (status === '5xx') {
                conditions.push(`status_code >= 500`);
            }
        }

        if (method && method !== 'all') {
            conditions.push(`method = $${paramIndex}`);
            values.push(method.toUpperCase());
            paramIndex++;
        }

        if (timeRange && timeRange !== 'all') {
            if (timeRange === '1h') {
                conditions.push(`timestamp >= NOW() - INTERVAL '1 hour'`);
            } else if (timeRange === '24h') {
                conditions.push(`timestamp >= NOW() - INTERVAL '24 hours'`);
            } else if (timeRange === '7d') {
                conditions.push(`timestamp >= NOW() - INTERVAL '7 days'`);
            } else if (timeRange === '30d') {
                conditions.push(`timestamp >= NOW() - INTERVAL '30 days'`);
            }
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Query total count
        const countQuery = `SELECT COUNT(*) FROM api_logs ${whereSql}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        // Query logs
        const logsQuery = `
            SELECT id, timestamp, method, endpoint, status_code, response_time_ms, success,
                   user_id, user_email, user_role, user_name, ip_address, user_agent,
                   query_params, request_body, response_body, error_message, error_stack
            FROM api_logs
            ${whereSql}
            ORDER BY timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const logsResult = await pool.query(logsQuery, [...values, limit, offset]);

        // Aggregate health stats (last 24 hours)
        const statsQuery = `
            SELECT 
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE success = true) as success_count,
                COUNT(*) FILTER (WHERE success = false) as error_count,
                COALESCE(ROUND(AVG(response_time_ms)), 0) as avg_response_time,
                COUNT(*) FILTER (WHERE status_code >= 500) as count_500,
                COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) as count_400,
                COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as count_200,
                COUNT(*) FILTER (WHERE success = false AND timestamp >= NOW() - INTERVAL '1 hour') as recent_errors_1h
            FROM api_logs
            WHERE timestamp >= NOW() - INTERVAL '24 hours'
        `;
        const statsResult = await pool.query(statsQuery);
        const rawStats = statsResult.rows[0] || {};

        const totalReq = parseInt(rawStats.total_requests || 0, 10);
        const errCount = parseInt(rawStats.error_count || 0, 10);
        const succCount = parseInt(rawStats.success_count || 0, 10);
        const errorRate = totalReq > 0 ? ((errCount / totalReq) * 100).toFixed(1) : '0.0';

        const stats = {
            totalRequests: totalReq,
            successCount: succCount,
            errorCount: errCount,
            errorRate: parseFloat(errorRate),
            avgResponseTime: parseInt(rawStats.avg_response_time || 0, 10),
            count500: parseInt(rawStats.count_500 || 0, 10),
            count400: parseInt(rawStats.count_400 || 0, 10),
            count200: parseInt(rawStats.count_200 || 0, 10),
            recentErrors1h: parseInt(rawStats.recent_errors_1h || 0, 10)
        };

        return res.json({
            logs: logsResult.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            },
            stats
        });
    } catch (err) {
        console.error('Error fetching API logs from DB:', err.message);

        // Resilience Fallback: Return in-memory buffer if DB fails
        const memLogs = getMemoryLogs();
        const total = memLogs.length;
        const errCount = memLogs.filter(l => !l.success).length;

        return res.json({
            logs: memLogs.slice(0, 50),
            pagination: {
                total,
                page: 1,
                limit: 50,
                totalPages: 1
            },
            stats: {
                totalRequests: total,
                successCount: total - errCount,
                errorCount: errCount,
                errorRate: total > 0 ? ((errCount / total) * 100).toFixed(1) : 0,
                avgResponseTime: 0,
                count500: memLogs.filter(l => l.status_code >= 500).length,
                count400: memLogs.filter(l => l.status_code >= 400 && l.status_code < 500).length,
                count200: memLogs.filter(l => l.status_code < 400).length,
                recentErrors1h: errCount
            },
            fallback: true,
            warning: 'Serving from live in-memory buffer: ' + err.message
        });
    }
};

/**
 * Get single API log details by ID
 */
exports.getApiLogDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM api_logs WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            // Check in-memory buffer
            const memLog = getMemoryLogs().find(l => String(l.id) === String(id));
            if (memLog) {
                return res.json(memLog);
            }
            return res.status(404).json({ error: 'API log entry not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching API log details:', err);
        res.status(500).json({ error: 'Failed to retrieve log details' });
    }
};

/**
 * Clear/Prune API logs (SuperAdmin only)
 */
exports.clearApiLogs = async (req, res) => {
    try {
        const { olderThanDays } = req.body || {};
        if (olderThanDays && parseInt(olderThanDays, 10) > 0) {
            const days = parseInt(olderThanDays, 10);
            await pool.query("DELETE FROM api_logs WHERE timestamp < NOW() - ($1 || ' days')::INTERVAL", [days]);
            return res.json({ message: `Logs older than ${days} days cleared successfully.` });
        }

        // Clear all logs
        await pool.query('TRUNCATE TABLE api_logs');
        clearMemoryLogs();
        res.json({ message: 'All API logs cleared successfully.' });
    } catch (err) {
        console.error('Error clearing API logs:', err);
        res.status(500).json({ error: 'Failed to clear logs' });
    }
};
