const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

const { cacheMiddleware, invalidateCache } = require('../middleware/cacheMiddleware');

// Invalidation middleware for member mutations
const clearMemberCache = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCache('members');
      invalidateCache('member');
      invalidateCache('system');
    }
  });
  next();
};

router.get('/', cacheMiddleware(180, 'members'), memberController.getAllMembers);
router.get('/meta/occupations', cacheMiddleware(600, 'meta:occupations'), memberController.getOccupations);
router.post('/', clearMemberCache, memberController.createMember);
router.get('/:id', cacheMiddleware(300, 'member'), memberController.getMemberById);
router.put('/:id', clearMemberCache, memberController.updateMember);
router.delete('/:id', clearMemberCache, memberController.deleteMember);
router.delete('/:id/spouses/:spouseId', clearMemberCache, memberController.deleteSpouseRelationship);
router.post('/:id/spouses', clearMemberCache, memberController.addSpouseRelationship);

module.exports = router;
