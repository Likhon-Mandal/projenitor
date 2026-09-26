const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

router.get('/', memberController.getAllMembers);
router.get('/meta/occupations', memberController.getOccupations);
router.post('/', memberController.createMember);
router.get('/:id', memberController.getMemberById);
router.put('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);
router.delete('/:id/spouses/:spouseId', memberController.deleteSpouseRelationship);
router.post('/:id/spouses', memberController.addSpouseRelationship);

module.exports = router;
