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
router.get('/admin-requests', requireSuperAdmin, adminController.getAdminRequests);
router.put('/admin-requests/:id', requireSuperAdmin, adminController.handleAdminRequest);

// User management - admin and superadmin
router.get('/users', requireAdmin, adminController.getUsers);
router.put('/users/:id/status', requireAdmin, adminController.updateUserStatus);
router.put('/users/:id/mobile', requireAdmin, adminController.updateUserMobile);
router.delete('/users/:id', requireSuperAdmin, adminController.deleteUser);

module.exports = router;
