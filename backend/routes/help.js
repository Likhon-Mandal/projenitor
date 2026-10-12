const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { cacheRoute, invalidateCache } = require('../middleware/cacheMiddleware');

const clearHelpCache = invalidateCache('/api/help');

// Read help requests (Cached 3 minutes)
router.get('/', cacheRoute(180), helpController.getHelpRequests);
router.post('/', authenticate, clearHelpCache, helpController.addHelpRequest);

// Protected: Admin management actions
router.put('/:id', authenticate, requireAdmin, clearHelpCache, helpController.updateHelpRequest);
router.delete('/:id', authenticate, requireAdmin, clearHelpCache, helpController.deleteHelpRequest);

module.exports = router;
