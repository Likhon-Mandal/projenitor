const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { cacheRoute, invalidateCache } = require('../middleware/cacheMiddleware');

const clearHistoryCache = invalidateCache('/api/history');

// Public: Read all history records (Cached 10 minutes)
router.get('/', cacheRoute(600), historyController.getHistoryRecords);

// Protected: Write operations (admin/superadmin only)
router.post('/', authenticate, requireAdmin, clearHistoryCache, historyController.addHistoryRecord);
router.put('/:id', authenticate, requireAdmin, clearHistoryCache, historyController.updateHistoryRecord);
router.delete('/:id', authenticate, requireAdmin, clearHistoryCache, historyController.deleteHistoryRecord);

module.exports = router;
