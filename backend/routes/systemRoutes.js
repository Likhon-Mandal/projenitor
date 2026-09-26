const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.get('/stats', systemController.getPublicStats);

// Admin only routes
router.use(authenticate, requireAdmin);
router.get('/recycle-bin', systemController.getRecycleBin);
router.put('/restore/:table/:id', systemController.restoreItem);

module.exports = router;
