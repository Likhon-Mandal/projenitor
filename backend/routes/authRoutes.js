const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/change-password', authenticate, authController.changePassword);
router.put('/update-profile', authenticate, authController.updateProfile);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
