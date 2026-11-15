const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Public storefront routes
router.get('/', userController.renderHome);
router.get('/products', userController.renderProducts);
router.get('/products/:id', userController.renderProductDetail);

// Cart routes
router.get('/cart', userController.renderCart);
router.post('/cart/add', userController.addToCart);
router.post('/cart/remove', userController.removeFromCart);

// Protected customer actions
router.post('/checkout', requireAuth, userController.checkout);
router.get('/profile', requireAuth, userController.renderProfile);

module.exports = router;
