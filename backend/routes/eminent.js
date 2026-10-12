const express = require('express');
const router = express.Router();
const eminentController = require('../controllers/eminentController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { cacheRoute, invalidateCache } = require('../middleware/cacheMiddleware');

const clearEminentCache = invalidateCache('/api/eminent');

// Public: Read (Cached 10 minutes)
router.get('/', cacheRoute(600), eminentController.getEminentFigures);

// Protected: Write (admin/superadmin only)
router.post('/', authenticate, requireAdmin, clearEminentCache, eminentController.addEminentFigure);
router.put('/:id', authenticate, requireAdmin, clearEminentCache, eminentController.updateEminentFigure);
router.delete('/:id', authenticate, requireAdmin, clearEminentCache, eminentController.deleteEminentFigure);

module.exports = router;
