const adminService = require('../services/adminService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const inventoryService = require('../services/inventoryService');
const customerService = require('../services/customerService');
const paymentService = require('../services/paymentService');
const shipmentService = require('../services/shipmentService');
const couponService = require('../services/couponService');
const reviewService = require('../services/reviewService');
const messageService = require('../services/messageService');
const rbacService = require('../services/rbacService');
const AdminActivityLog = require('../models/AdminActivityLog');
const ORDER_STATUS = require('../constants/orderStatus');

class AdminController {
  // 1. Dashboard
  async renderDashboard(req, res, next) {
    try {
      const timeRange = req.query.range || '7D';
      const stats = await adminService.getDashboardAnalytics(timeRange);
      res.render('admin/dashboard', {
        title: 'Dashboard Overview - Neleeri Sneakers',
        activePage: 'dashboard',
        timeRange,
        stats,
        ...stats,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  // 2. Orders Management Suite
  async renderOrders(req, res, next) {
    try {
      const { status = 'ALL', search = '', gateway = 'All Gateways', courier = 'All Logistics', selectedId } = req.query;
      const orders = await orderService.getAllOrders({
        status: status !== 'ALL' ? status : undefined,
        search,
        gateway,
        courier,
      });

      // Selected order for the slide-over inspector drawer
      let selectedOrder = null;
      if (selectedId) {
        selectedOrder = orders.find((o) => o.id === selectedId || o.order_number === selectedId) || null;
      }
      if (!selectedOrder && orders.length > 0) {
        selectedOrder = orders[0];
      }

      const allOrdersUnfiltered = await orderService.getAllOrders({});
      const counts = {
        all: allOrdersUnfiltered.length,
        unfulfilled: allOrdersUnfiltered.filter((o) => o.order_status === 'PROCESSING' || o.order_status === 'PENDING').length,
        inTransit: allOrdersUnfiltered.filter((o) => o.order_status === 'DISPATCHED' || o.order_status === 'IN_TRANSIT').length,
        delivered: allOrdersUnfiltered.filter((o) => o.order_status === 'DELIVERED').length,
        exceptions: allOrdersUnfiltered.filter((o) => o.order_status === 'CANCELLED' || o.order_status === 'RETURNED').length,
      };

      res.render('admin/orders', {
        title: 'Order Fulfillment & Dispatch Matrix - Neleeri Sneakers',
        activePage: 'orders',
        orders,
        selectedOrder,
        counts,
        currentStatus: status,
        currentGateway: gateway,
        currentCourier: courier,
        searchQuery: search,
        orderStatuses: ORDER_STATUS,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      await orderService.updateOrderStatus(id, status, req.user, req.ip);
      res.redirect(`/admin/orders?selectedId=${id}&success=${encodeURIComponent(`Order ${id} status updated to ${status}.`)}`);
    } catch (err) {
      res.redirect(`/admin/orders?error=${encodeURIComponent(err.message)}`);
    }
  }

  async bulkDispatchOrders(req, res, next) {
    try {
      const { orderIds, courier_name } = req.body;
      const ids = Array.isArray(orderIds) ? orderIds : (orderIds ? [orderIds] : []);
      if (ids.length === 0) {
        throw new Error('No orders were selected for dispatch.');
      }
      await orderService.bulkDispatch(ids, courier_name, req.user, req.ip);
      res.redirect(`/admin/orders?success=${encodeURIComponent(`Successfully manifested and dispatched ${ids.length} orders.`)}`);
    } catch (err) {
      res.redirect(`/admin/orders?error=${encodeURIComponent(err.message)}`);
    }
  }

  async renderOrderInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoiceData = await orderService.getOrderInvoiceData(id);
      res.render('admin/order-invoice', {
        title: `Tax Invoice - ${invoiceData.invoiceNumber}`,
        ...invoiceData,
      });
    } catch (err) {
      next(err);
    }
  }

  async renderShippingLabel(req, res, next) {
    try {
      const { id } = req.params;
      const labelData = await orderService.getOrderShippingLabelData(id);
      res.render('admin/order-label', {
        title: `Shipping Label - ${labelData.trackingNumber}`,
        ...labelData,
      });
    } catch (err) {
      next(err);
    }
  }

  // 3. Products
  async renderProducts(req, res, next) {
    try {
      const { category, search, stock_status, sort } = req.query;
      const products = await productService.getAllProducts({
        category,
        search,
        stock_status,
        sort,
      });
      const categories = await productService.getAllCategories();

      res.render('admin/products', {
        title: 'Products & Inventory Catalog - Neleeri Sneakers',
        activePage: 'products',
        products,
        categories,
        currentCategory: category || 'ALL',
        currentStockStatus: stock_status || 'ALL',
        currentSort: sort || 'newest',
        searchQuery: search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      await productService.createProduct(req.body, req.user, req.ip);
      res.redirect('/admin/products?success=New sneaker model deployed successfully.');
    } catch (err) {
      res.redirect(`/admin/products?error=${encodeURIComponent(err.message)}`);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      await productService.updateProduct(id, req.body, req.user, req.ip);
      res.redirect('/admin/products?success=Product parameters updated.');
    } catch (err) {
      res.redirect(`/admin/products?error=${encodeURIComponent(err.message)}`);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id, req.user, req.ip);
      res.redirect('/admin/products?success=Sneaker silhouette removed from active catalog.');
    } catch (err) {
      res.redirect(`/admin/products?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 4. Categories
  async renderCategories(req, res, next) {
    try {
      const categories = await productService.getAllCategories();
      res.render('admin/categories', {
        title: 'Product Categories - Neleeri Sneakers',
        activePage: 'categories',
        categories,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req, res, next) {
    try {
      await productService.createCategory(req.body, req.user, req.ip);
      res.redirect('/admin/categories?success=New sneaker category added.');
    } catch (err) {
      res.redirect(`/admin/categories?error=${encodeURIComponent(err.message)}`);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      await productService.updateCategory(id, req.body, req.user, req.ip);
      res.redirect('/admin/categories?success=Category details updated.');
    } catch (err) {
      res.redirect(`/admin/categories?error=${encodeURIComponent(err.message)}`);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await productService.deleteCategory(id, req.user, req.ip);
      res.redirect('/admin/categories?success=Category removed.');
    } catch (err) {
      res.redirect(`/admin/categories?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 4b. Product Variants
  async renderVariants(req, res, next) {
    try {
      const { product_id, size, stock_status, search } = req.query;
      let variants = await productService.getAllVariants({ product_id });
      const products = await productService.getAllProducts();

      if (search) {
        const q = search.toLowerCase();
        variants = variants.filter(
          (v) =>
            v.sku.toLowerCase().includes(q) ||
            v.product_name.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q) ||
            v.size.toLowerCase().includes(q)
        );
      }
      if (size) {
        variants = variants.filter((v) => v.size.toLowerCase() === size.toLowerCase());
      }
      if (stock_status === 'low') {
        variants = variants.filter((v) => v.stock_quantity > 0 && v.stock_quantity <= (v.low_stock_threshold || 10));
      } else if (stock_status === 'out') {
        variants = variants.filter((v) => v.stock_quantity <= 0);
      } else if (stock_status === 'in') {
        variants = variants.filter((v) => v.stock_quantity > (v.low_stock_threshold || 10));
      }

      res.render('admin/variants', {
        title: 'Product Variants & Sizes - Neleeri Sneakers',
        activePage: 'variants',
        variants,
        products,
        filterProductId: product_id || '',
        filterSize: size || '',
        filterStockStatus: stock_status || '',
        searchQuery: search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async createVariant(req, res, next) {
    try {
      await productService.createVariant(req.body, req.user, req.ip);
      res.redirect('/admin/variants?success=New sneaker size/color variant created.');
    } catch (err) {
      res.redirect(`/admin/variants?error=${encodeURIComponent(err.message)}`);
    }
  }

  async updateVariant(req, res, next) {
    try {
      const { id } = req.params;
      await productService.updateVariant(id, req.body, req.user, req.ip);
      res.redirect('/admin/variants?success=Variant specifications updated.');
    } catch (err) {
      res.redirect(`/admin/variants?error=${encodeURIComponent(err.message)}`);
    }
  }

  async deleteVariant(req, res, next) {
    try {
      const { id } = req.params;
      await productService.deleteVariant(id, req.user, req.ip);
      res.redirect('/admin/variants?success=Variant removed.');
    } catch (err) {
      res.redirect(`/admin/variants?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 5. Inventory Management
  async renderInventory(req, res, next) {
    try {
      const overview = await inventoryService.getInventoryOverview(req.query);
      res.render('admin/inventory', {
        title: 'Inventory & Stock Velocity - Neleeri Sneakers',
        activePage: 'inventory',
        ...overview,
        searchQuery: req.query.search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const { variant_id, product_id, quantity_change, change_type, notes } = req.body;
      await inventoryService.adjustStock({
        variant_id,
        product_id,
        quantity_change,
        change_type,
        notes,
        adminUser: req.user,
        ip: req.ip,
      });
      res.redirect('/admin/inventory?success=Inventory stock adjusted and movement recorded in audit logs.');
    } catch (err) {
      res.redirect(`/admin/inventory?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 6. Customers Squad
  async renderCustomers(req, res, next) {
    try {
      const customers = await customerService.getAllCustomers(req.query);
      res.render('admin/customers', {
        title: 'Customer Squad Management - Neleeri Sneakers',
        activePage: 'customers',
        customers,
        searchQuery: req.query.search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerDetail(req, res, next) {
    try {
      const { id } = req.params;
      const data = await customerService.getCustomerProfile(id);
      res.json({ success: true, data });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  async updateCustomerStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { account_status } = req.body;
      await customerService.updateCustomerStatus(id, account_status, req.user, req.ip);
      res.redirect(`/admin/customers?success=${encodeURIComponent(`Customer account updated to ${account_status}.`)}`);
    } catch (err) {
      res.redirect(`/admin/customers?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 7. Payments
  async renderPayments(req, res, next) {
    try {
      const paymentData = await paymentService.getAllPayments(req.query);
      res.render('admin/payments', {
        title: 'Payments & Settlement Ledger - Neleeri Sneakers',
        activePage: 'payments',
        ...paymentData,
        currentStatus: req.query.status || 'ALL',
        searchQuery: req.query.search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePaymentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      await paymentService.updatePaymentStatus(id, status, notes, req.user, req.ip);
      res.redirect('/admin/payments?success=Payment transaction status updated.');
    } catch (err) {
      res.redirect(`/admin/payments?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 8. Shipments
  async renderShipments(req, res, next) {
    try {
      const shipmentData = await shipmentService.getAllShipments(req.query);
      res.render('admin/shipments', {
        title: 'Shipments & Air Cargo Logistics - Neleeri Sneakers',
        activePage: 'shipments',
        ...shipmentData,
        currentStatus: req.query.shipping_status || 'ALL',
        searchQuery: req.query.search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateShipmentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { shipping_status, notes } = req.body;
      await shipmentService.updateShipmentStatus(id, shipping_status, notes, req.user, req.ip);
      res.redirect('/admin/shipments?success=Shipment flight telemetry and status updated.');
    } catch (err) {
      res.redirect(`/admin/shipments?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 9. Coupons
  async renderCoupons(req, res, next) {
    try {
      const coupons = await couponService.getAllCoupons(req.query);
      res.render('admin/coupons', {
        title: 'Coupons & Drop Promotions - Neleeri Sneakers',
        activePage: 'coupons',
        coupons,
        searchQuery: req.query.search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async createCoupon(req, res, next) {
    try {
      await couponService.createCoupon(req.body, req.user, req.ip);
      res.redirect('/admin/coupons?success=New promo code deployed successfully.');
    } catch (err) {
      res.redirect(`/admin/coupons?error=${encodeURIComponent(err.message)}`);
    }
  }

  async toggleCoupon(req, res, next) {
    try {
      const { id } = req.params;
      await couponService.toggleCoupon(id, req.user, req.ip);
      res.redirect('/admin/coupons?success=Coupon status toggled.');
    } catch (err) {
      res.redirect(`/admin/coupons?error=${encodeURIComponent(err.message)}`);
    }
  }

  async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      await couponService.deleteCoupon(id, req.user, req.ip);
      res.redirect('/admin/coupons?success=Coupon code removed.');
    } catch (err) {
      res.redirect(`/admin/coupons?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 10. Reviews & Moderation
  async renderReviews(req, res, next) {
    try {
      const reviews = await reviewService.getAllReviews(req.query);
      res.render('admin/reviews', {
        title: 'Reviews & Squad Moderation - Neleeri Sneakers',
        activePage: 'reviews',
        reviews,
        currentStatus: req.query.status || 'ALL',
        searchQuery: req.query.search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateReviewStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await reviewService.updateReviewStatus(id, status, req.user, req.ip);
      res.redirect(`/admin/reviews?success=${encodeURIComponent(`Review status updated to ${status}.`)}`);
    } catch (err) {
      res.redirect(`/admin/reviews?error=${encodeURIComponent(err.message)}`);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      await reviewService.deleteReview(id, req.user, req.ip);
      res.redirect('/admin/reviews?success=Review entry deleted.');
    } catch (err) {
      res.redirect(`/admin/reviews?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 11. Contact Messages
  async renderMessages(req, res, next) {
    try {
      const messages = await messageService.getAllMessages(req.query);
      res.render('admin/messages', {
        title: 'Contact Messages & Support Inquiries - Neleeri Sneakers',
        activePage: 'messages',
        messages,
        currentStatus: req.query.status || 'ALL',
        searchQuery: req.query.search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMessageStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await messageService.updateMessageStatus(id, status, req.user, req.ip);
      res.redirect(`/admin/messages?success=${encodeURIComponent(`Message status set to ${status}.`)}`);
    } catch (err) {
      res.redirect(`/admin/messages?error=${encodeURIComponent(err.message)}`);
    }
  }

  async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      await messageService.deleteMessage(id, req.user, req.ip);
      res.redirect('/admin/messages?success=Support inquiry deleted.');
    } catch (err) {
      res.redirect(`/admin/messages?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 12. Administration - Admin Users
  async renderAdminUsers(req, res, next) {
    try {
      const adminUsers = await adminService.getAdminUsers();
      const roles = await rbacService.getAllRoles();
      res.render('admin/admin-users', {
        title: 'Admin Users & Access Control - Neleeri Sneakers',
        activePage: 'admin-users',
        adminUsers,
        roles,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async createAdminUser(req, res, next) {
    try {
      await adminService.createAdminUser(req.body);
      res.redirect('/admin/admin-users?success=New administrator registered successfully.');
    } catch (err) {
      res.redirect(`/admin/admin-users?error=${encodeURIComponent(err.message)}`);
    }
  }

  async updateAdminRole(req, res, next) {
    try {
      const { id } = req.params;
      const role = req.body.role || req.body.role_id;
      await adminService.updateUserRole(id, role, req.user ? req.user.id : 'usr_admin_001');
      res.redirect('/admin/admin-users?success=Administrator role permissions updated.');
    } catch (err) {
      res.redirect(`/admin/admin-users?error=${encodeURIComponent(err.message)}`);
    }
  }

  async toggleAdminStatus(req, res, next) {
    try {
      const { id } = req.params;
      if (req.body && req.body.role) {
        await adminService.updateUserRole(id, req.body.role, req.user ? req.user.id : 'usr_admin_001');
        return res.redirect('/admin/users?success=User role updated successfully.');
      }
      await adminService.toggleUserStatus(id);
      res.redirect('/admin/admin-users?success=Admin account state toggled.');
    } catch (err) {
      res.redirect(`/admin/admin-users?error=${encodeURIComponent(err.message)}`);
    }
  }

  // 13. Administration - Roles & Permissions
  async renderRoles(req, res, next) {
    try {
      const roles = await rbacService.getAllRoles();
      const permissions = await rbacService.getAllPermissions();
      res.render('admin/roles', {
        title: 'Roles & Permission Matrix - Neleeri Sneakers',
        activePage: 'roles',
        roles,
        permissions,
        allPermissions: permissions,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async createRole(req, res, next) {
    try {
      await rbacService.createRole(req.body, req.user, req.ip);
      res.redirect('/admin/roles?success=New role added to security matrix.');
    } catch (err) {
      res.redirect(`/admin/roles?error=${encodeURIComponent(err.message)}`);
    }
  }

  async updateRolePermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { permission_ids } = req.body;
      const pids = Array.isArray(permission_ids) ? permission_ids : (permission_ids ? [permission_ids] : []);
      await rbacService.updateRolePermissions(id, pids, req.user, req.ip);
      res.redirect('/admin/roles?success=Role permission matrix saved.');
    } catch (err) {
      res.redirect(`/admin/roles?error=${encodeURIComponent(err.message)}`);
    }
  }

  async renderPermissions(req, res, next) {
    try {
      const permissions = await rbacService.getAllPermissions();
      res.render('admin/permissions', {
        title: 'System Permissions Catalog - Neleeri Sneakers',
        activePage: 'roles',
        permissions,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  // 14. Activity Logs
  async renderActivityLogs(req, res, next) {
    try {
      const logs = await AdminActivityLog.find(req.query);
      res.render('admin/activity-logs', {
        title: 'Admin Activity & Security Audit Logs - Neleeri Sneakers',
        activePage: 'activity-logs',
        logs,
        currentModule: req.query.module || 'ALL',
        searchQuery: req.query.search || '',
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  // 15. Settings & Profile
  async renderSettings(req, res, next) {
    try {
      res.render('admin/settings', {
        title: 'System Settings & Lead Profile - Neleeri Sneakers',
        activePage: 'settings',
        user: req.user,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();