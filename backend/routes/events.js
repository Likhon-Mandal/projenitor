const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Optional auth helper to associate logged-in user name with memories
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_projenitor_123');
            const result = await pool.query(
                'SELECT id, name, name_bangla, name_english, email, role FROM admin_users WHERE id = $1',
                [decoded.id]
            );
            if (result.rows.length > 0) {
                req.user = result.rows[0];
            }
        }
    } catch (e) {
        // Ignore token error, allow guest upload
    }
    next();
};

const { cacheMiddleware, invalidateCache } = require('../middleware/cacheMiddleware');

const clearEventsCache = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCache('events');
    }
  });
  next();
};

// Public: Read events (Cached for 5 minutes)
router.get('/', cacheMiddleware(300, 'events'), eventController.getEvents);

// Protected: Write events (admin/superadmin only)
router.post('/', authenticate, requireAdmin, clearEventsCache, eventController.addEvent);
router.put('/:id', authenticate, requireAdmin, clearEventsCache, eventController.updateEvent);
router.delete('/:id', authenticate, requireAdmin, clearEventsCache, eventController.deleteEvent);

// Memories for previous events (Public read, Admin/Superadmin write)
router.get('/:id/memories', cacheMiddleware(300, 'events:memories'), eventController.getEventMemories);
router.post('/:id/memories', authenticate, requireAdmin, clearEventsCache, eventController.addEventMemory);
router.delete('/:id/memories/:memoryId', authenticate, requireAdmin, clearEventsCache, eventController.deleteEventMemory);

module.exports = router;

