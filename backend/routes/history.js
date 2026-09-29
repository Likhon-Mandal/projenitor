const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// Public: Read all history records
router.get('/', historyController.getHistoryRecords);

// Protected: Write operations (admin/superadmin only)
router.post('/', authenticate, requireAdmin, historyController.addHistoryRecord);
router.put('/:id', authenticate, requireAdmin, historyController.updateHistoryRecord);
router.delete('/:id', authenticate, requireAdmin, historyController.deleteHistoryRecord);

module.exports = router;
