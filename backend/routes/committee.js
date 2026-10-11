const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// Public: Read
router.get('/', committeeController.getCommittees);
router.get('/leaders', committeeController.getLeaders);

// Protected: Write (admin/superadmin only)
router.post('/', authenticate, requireAdmin, committeeController.createCommittee);
router.put('/:id', authenticate, requireAdmin, committeeController.updateCommittee);
router.delete('/:id', authenticate, requireAdmin, committeeController.deleteCommittee);

module.exports = router;
