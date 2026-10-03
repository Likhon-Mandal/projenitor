const express = require('express');
const router = express.Router();
const brilliantStudentController = require('../controllers/brilliantStudentController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// Member / User routes
router.post('/request', authenticate, brilliantStudentController.submitRequest);
router.get('/my-requests', authenticate, brilliantStudentController.getMyRequests);

// Admin / SuperAdmin review routes
router.get('/admin/requests', authenticate, requireAdmin, brilliantStudentController.getAllRequestsAdmin);
router.put('/admin/requests/:id', authenticate, requireAdmin, brilliantStudentController.handleRequestAction);
router.delete('/admin/requests/:id', authenticate, requireAdmin, brilliantStudentController.deleteRequest);

module.exports = router;
