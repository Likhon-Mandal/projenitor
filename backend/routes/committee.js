const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const { cacheMiddleware, invalidateCache, clearCacheNow } = require('../middleware/cacheMiddleware');

const clearCommitteeCache = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      clearCacheNow('committee');
      clearCacheNow('committee:leaders');
    }
  });
  next();
};

// Public: Read (Cached for 10 minutes)
router.get('/', cacheMiddleware(600, 'committee'), committeeController.getCommittees);
router.get('/leaders', cacheMiddleware(600, 'committee:leaders'), committeeController.getLeaders);

// Protected: Write (admin/superadmin only)
router.post('/', authenticate, requireAdmin, clearCommitteeCache, committeeController.createCommittee);
router.put('/:id', authenticate, requireAdmin, clearCommitteeCache, committeeController.updateCommittee);
router.delete('/:id', authenticate, requireAdmin, clearCommitteeCache, committeeController.deleteCommittee);

module.exports = router;
