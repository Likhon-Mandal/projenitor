const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Dashboard stats — admin and superadmin
router.get('/stats', requireAdmin, adminController.getDashboardStats);
router.get('/chart-data', requireAdmin, adminController.getChartData);

// Admin management — superadmin only
router.get('/admins', requireSuperAdmin, adminController.getAdmins);
router.post('/admins', requireSuperAdmin, adminController.createAdmin);
router.put('/admins/:id', requireSuperAdmin, adminController.updateAdmin);
router.delete('/admins/:id', requireSuperAdmin, adminController.deleteAdmin);

module.exports = router;
