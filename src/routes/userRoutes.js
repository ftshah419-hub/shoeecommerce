const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');

/**
 * Route protection wrapper:
 * 1. Checks if req.user is set by authMiddleware (teammate's auth branch).
 * 2. In standalone hackathon testing / development, if no token is yet issued,
 *    gracefully attaches the seeded demo user so User screens can be viewed & tested.
 */
const resolveAuthOrDemo = (req, res, next) => {
  if (req.user) {
    return next();
  }

  // If in development mode or explicitly testing demo user
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

  // In strict production, delegate to requireAuth
  return requireAuth(req, res, next);
};

// ==========================================
// USER DASHBOARD & ACCOUNT ROUTES (PROTECTED)
// Supports both mount paths: app.use('/user', userRoutes) and router.use('/', userRoutes)
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

// ==========================================
// STOREFRONT PUBLIC ROUTES & CART
// ==========================================
router.get('/', userController.renderHome);
router.get('/products', userController.renderProducts);
router.get('/products/:id', userController.renderProductDetail);

// Cart routes
router.get('/cart', userController.renderCart);
router.post('/cart/add', userController.addToCart);
router.post('/cart/remove', userController.removeFromCart);

// Protected customer actions
router.post('/checkout', resolveAuthOrDemo, userController.checkout);

module.exports = router;
