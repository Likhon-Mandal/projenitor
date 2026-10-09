const express = require('express');
const router = express.Router();
const sammelanController = require('../controllers/sammelanController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', sammelanController.getAllSammelans);
router.get('/next', sammelanController.getNextSammelan);
router.get('/homes-lookup', sammelanController.getHomesLookup);
router.get('/:id', sammelanController.getSammelanById);

// Admin routes
router.post('/', authenticate, requireAdmin, sammelanController.createSammelan);
router.put('/:id', authenticate, requireAdmin, sammelanController.updateSammelan);
router.delete('/:id', authenticate, requireAdmin, sammelanController.deleteSammelan);
router.patch('/:id/set-next', authenticate, requireAdmin, sammelanController.setNextSammelan);

module.exports = router;
