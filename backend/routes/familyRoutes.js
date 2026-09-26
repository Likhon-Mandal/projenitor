const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');

router.get('/hierarchy', familyController.getGeographicHierarchy);
router.post('/location', familyController.addLocationItem);
router.put('/location', familyController.editLocationItem);
router.delete('/location', familyController.deleteLocationItem);
router.get('/household', familyController.getFamilyMembers);
router.get('/spouses', familyController.getAllSpouses);
router.get('/relatives/:id', familyController.getRelatives);

module.exports = router;

