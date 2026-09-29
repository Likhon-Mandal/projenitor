const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.get('/hierarchy', familyController.getGeographicHierarchy);
router.post('/location', authenticate, requireAdmin, familyController.addLocationItem);
router.put('/location', authenticate, requireAdmin, familyController.editLocationItem);
router.delete('/location', authenticate, requireAdmin, familyController.deleteLocationItem);
router.get('/household', familyController.getFamilyMembers);
router.get('/home-details', familyController.getHomeDetails);
router.put('/home-map', authenticate, requireAdmin, familyController.updateHomeMapLink);
router.get('/spouses', familyController.getAllSpouses);
router.get('/relatives/:id', familyController.getRelatives);

module.exports = router;

