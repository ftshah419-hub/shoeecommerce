const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authorizeRoles, requirePermission } = require('../middlewares/roleMiddleware');
const ROLES = require('../constants/roles');

// Restrict entire admin router to Admin roles
router.use(authorizeRoles(ROLES.ADMIN));

// 1. Dashboard
router.get('/dashboard', adminController.renderDashboard);

// 2. Orders Management Suite
router.get('/orders', adminController.renderOrders);
router.post('/orders/bulk-dispatch', adminController.bulkDispatchOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);
router.get('/orders/:id/invoice', adminController.renderOrderInvoice);
router.get('/orders/:id/label', adminController.renderShippingLabel);

// 3. Products
router.get('/products', adminController.renderProducts);
router.post('/products', adminController.createProduct);
router.post('/products/:id/edit', adminController.updateProduct);
router.post('/products/:id/delete', adminController.deleteProduct);

// 4. Categories
router.get('/categories', adminController.renderCategories);
router.post('/categories', adminController.createCategory);
router.post('/categories/:id/edit', adminController.updateCategory);
router.post('/categories/:id/delete', adminController.deleteCategory);

// 4b. Product Variants
router.get('/variants', adminController.renderVariants);
router.post('/variants', adminController.createVariant);
router.post('/variants/:id/edit', adminController.updateVariant);
router.post('/variants/:id/delete', adminController.deleteVariant);

// 5. Inventory
router.get('/inventory', adminController.renderInventory);
router.post('/inventory/adjust', adminController.adjustStock);

// 6. Customers Squad
router.get('/customers', adminController.renderCustomers);
router.get('/customers/:id/detail', adminController.getCustomerDetail);
router.post('/customers/:id/status', adminController.updateCustomerStatus);

// 7. Payments
router.get('/payments', adminController.renderPayments);
router.post('/payments/:id/status', adminController.updatePaymentStatus);

// 8. Shipments
router.get('/shipments', adminController.renderShipments);
router.post('/shipments/:id/status', adminController.updateShipmentStatus);

// 9. Coupons
router.get('/coupons', adminController.renderCoupons);
router.post('/coupons', adminController.createCoupon);
router.post('/coupons/:id/toggle', adminController.toggleCoupon);
router.post('/coupons/:id/delete', adminController.deleteCoupon);

// 10. Reviews & Moderation
router.get('/reviews', adminController.renderReviews);
router.post('/reviews/:id/status', adminController.updateReviewStatus);
router.post('/reviews/:id/delete', adminController.deleteReview);

// 11. Contact Messages
router.get('/messages', adminController.renderMessages);
router.post('/messages/:id/status', adminController.updateMessageStatus);
router.post('/messages/:id/delete', adminController.deleteMessage);

// 12. Administration - Admin Users
router.get('/admin-users', adminController.renderAdminUsers);
router.post('/admin-users', adminController.createAdminUser);
router.post('/admin-users/:id/role', adminController.updateAdminRole);
router.post('/admin-users/:id/status', adminController.toggleAdminStatus);

// 13. Administration - Roles & Permissions
router.get('/roles', adminController.renderRoles);
router.post('/roles', adminController.createRole);
router.post('/roles/:id/permissions', adminController.updateRolePermissions);
router.get('/permissions', adminController.renderPermissions);

// 14. Activity Logs
router.get('/activity-logs', adminController.renderActivityLogs);

// 15. Settings
router.get('/settings', adminController.renderSettings);

module.exports = router;
