const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { cacheRoute, invalidateCache } = require('../middleware/cacheMiddleware');

const clearNoticeCache = invalidateCache('/api/notices');

// Public: Read (Cached 5 minutes)
router.get('/', cacheRoute(300), noticeController.getNotices);

// Protected: Write (admin/superadmin only)
router.post('/', authenticate, requireAdmin, clearNoticeCache, noticeController.addNotice);
router.put('/:id', authenticate, requireAdmin, clearNoticeCache, noticeController.updateNotice);
router.delete('/:id', authenticate, requireAdmin, clearNoticeCache, noticeController.deleteNotice);

module.exports = router;
