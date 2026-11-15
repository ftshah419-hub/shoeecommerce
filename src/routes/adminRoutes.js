const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const ROLES = require('../constants/roles');

// Restrict entire admin router to 'admin' role
router.use(authorizeRoles(ROLES.ADMIN));

// Admin Dashboard
router.get('/dashboard', adminController.renderDashboard);

// Product Inventory Management
router.get('/products', adminController.renderProducts);
router.post('/products', adminController.createProduct);
router.post('/products/:id/delete', adminController.deleteProduct);

// Orders Management
router.get('/orders', adminController.renderOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);

// User Management
router.get('/users', adminController.renderUsers);
router.post('/users/:id/role', adminController.updateUserRole);

module.exports = router;
