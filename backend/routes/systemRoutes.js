const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

const { cacheMiddleware, invalidateCache } = require('../middleware/cacheMiddleware');

router.get('/stats', cacheMiddleware(300, 'system:stats'), systemController.getPublicStats);
router.get('/notifications', cacheMiddleware(180, 'system:notifications'), systemController.getPublicNotifications);

// Admin only routes
router.use(authenticate, requireAdmin);
router.get('/recycle-bin', systemController.getRecycleBin);
router.put('/restore/:table/:id', systemController.restoreItem);

// SuperAdmin only routes: Permanent deletion
router.delete('/permanent/:table/:id', requireSuperAdmin, systemController.permanentDeleteItem);
router.delete('/empty', requireSuperAdmin, systemController.emptyRecycleBin);

module.exports = router;
