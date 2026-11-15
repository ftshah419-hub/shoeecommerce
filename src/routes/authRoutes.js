const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginRateLimiter, otpRateLimiter } = require('../middlewares/rateLimitMiddleware');

// 1. Customer Login Flow
router.get('/login', authController.renderLogin);
router.post('/login', loginRateLimiter, authController.login);

// 2. Customer Registration Flow
router.get('/register', authController.renderRegister);
router.post('/register', authController.register);

// 3. Password Recovery / Forgot Password Flow
router.get('/forgot-password', authController.renderForgotPassword);
router.post('/forgot-password', otpRateLimiter, authController.forgotPassword);

// 4. OTP Verification & Resend Flow
router.get('/verify-otp', authController.renderVerifyOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', otpRateLimiter, authController.resendOtp);

// 5. Password Reset Flow
router.get('/reset-password', authController.renderResetPassword);
router.post('/reset-password', authController.resetPassword);

// 6. Email Verification
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);

// 7. Logout Flow
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

// 8. Social Authentication (Google / Apple)
router.get('/social/:provider', authController.socialAuthRedirect);
router.post('/social/:provider', authController.socialLogin);

module.exports = router;
