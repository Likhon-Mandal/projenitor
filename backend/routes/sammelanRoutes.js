const express = require('express');
const router = express.Router();
const sammelanController = require('../controllers/sammelanController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { cacheRoute, invalidateCache } = require('../middleware/cacheMiddleware');

const clearSammelanCache = invalidateCache('/api/sammelans');

// Public routes (Cached)
router.get('/', cacheRoute(600), sammelanController.getAllSammelans);
router.get('/next', cacheRoute(600), sammelanController.getNextSammelan);
router.get('/homes-lookup', cacheRoute(1200), sammelanController.getHomesLookup);
router.get('/:id', cacheRoute(600), sammelanController.getSammelanById);

// Admin routes (Invalidate cache on mutation)
router.post('/', authenticate, requireAdmin, clearSammelanCache, sammelanController.createSammelan);
router.put('/:id', authenticate, requireAdmin, clearSammelanCache, sammelanController.updateSammelan);
router.delete('/:id', authenticate, requireAdmin, clearSammelanCache, sammelanController.deleteSammelan);
router.patch('/:id/set-next', authenticate, requireAdmin, clearSammelanCache, sammelanController.setNextSammelan);

module.exports = router;
