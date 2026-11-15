const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { loginRateLimiter, otpRateLimiter } = require('../middlewares/rateLimitMiddleware');

// Current Authenticated User & Permissions
router.get('/me', requireAuth, authController.getCurrentUser);

// REST Authentication Endpoints
router.post('/register', authController.register);
router.post('/login', loginRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', otpRateLimiter, authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', otpRateLimiter, authController.resendOtp);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/social/:provider', authController.socialLogin);

module.exports = router;
