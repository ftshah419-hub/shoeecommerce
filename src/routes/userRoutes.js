const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');

const resolveAuthOrDemo = (req, res, next) => {
  if (req.user) {
    return next();
  }

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    req.user = {
      id: 'usr_customer_001',
      name: 'John Doe',
      full_name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    };
    if (res.locals && !res.locals.currentUser) {
      res.locals.currentUser = req.user;
    }
    return next();
  }

  return requireAuth(req, res, next);
};

// ==========================================
// USER DASHBOARD & ACCOUNT ROUTES (PROTECTED)
// ==========================================

// Dashboard
router.get('/dashboard', resolveAuthOrDemo, userController.renderDashboard);
router.get('/user/dashboard', resolveAuthOrDemo, userController.renderDashboard);

// Profile
router.get('/profile', resolveAuthOrDemo, userController.renderProfile);
router.get('/user/profile', resolveAuthOrDemo, userController.renderProfile);
router.post('/profile', resolveAuthOrDemo, userController.updateProfile);
router.put('/profile', resolveAuthOrDemo, userController.updateProfile);
router.post('/user/profile', resolveAuthOrDemo, userController.updateProfile);
router.put('/user/profile', resolveAuthOrDemo, userController.updateProfile);

// Settings
router.get('/settings', resolveAuthOrDemo, userController.renderSettings);
router.get('/user/settings', resolveAuthOrDemo, userController.renderSettings);

// Addresses (matching addresses table in ERD)
router.post('/addresses', resolveAuthOrDemo, userController.addAddress);
router.post('/user/addresses', resolveAuthOrDemo, userController.addAddress);
router.post('/addresses/:id/delete', resolveAuthOrDemo, userController.deleteAddress);
router.post('/user/addresses/:id/delete', resolveAuthOrDemo, userController.deleteAddress);
router.post('/addresses/:id/default', resolveAuthOrDemo, userController.setDefaultAddress);
router.post('/user/addresses/:id/default', resolveAuthOrDemo, userController.setDefaultAddress);

// Password Recovery & OTP Verification Protocol
router.get('/password-recovery', userController.renderPasswordRecovery);
router.get('/user/password-recovery', userController.renderPasswordRecovery);
router.post('/password-recovery', userController.processPasswordRecovery);
router.post('/user/password-recovery', userController.processPasswordRecovery);

// ==========================================
// STOREFRONT PUBLIC ROUTES & CART
// ==========================================

router.get('/', userController.renderHome);
router.get('/products', userController.renderProducts);
router.get('/products/:id', userController.renderProductDetail);

// Shopping Bag
router.get('/cart', userController.renderCart);
router.post('/cart/add', userController.addToCart);
router.post('/cart/remove', userController.removeFromCart);

// Checkout Terminal
router.get('/checkout', resolveAuthOrDemo, userController.renderCheckout);
router.post('/checkout', resolveAuthOrDemo, userController.checkout);

// Order Confirmation & Live Tracking
router.get('/order-confirmed', resolveAuthOrDemo, userController.renderOrderTracking);
router.get('/orders/:id/track', resolveAuthOrDemo, userController.renderOrderTracking);

module.exports = router;
