const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

// Normal User Auth & Registration Routes
router.post('/register', userController.registerRequest);
router.post('/check-status', userController.checkStatus);
router.post('/set-password', userController.setPassword);
router.post('/login', userController.login);
router.get('/profile', authenticate, userController.getProfile);
router.post('/request-admin', authenticate, userController.requestAdmin);
router.get('/admin-request-status', authenticate, userController.getAdminRequestStatus);

module.exports = router;
