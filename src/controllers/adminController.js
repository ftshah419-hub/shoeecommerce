const adminService = require('../services/adminService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const ORDER_STATUS = require('../constants/orderStatus');

class AdminController {
  async renderDashboard(req, res, next) {
    try {
      const stats = await adminService.getDashboardAnalytics();
      res.render('admin/dashboard', {
        title: 'Admin Dashboard - Neleeri Sneakers',
        stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async renderProducts(req, res, next) {
    try {
      const products = await productService.getAllProducts();
      res.render('admin/products', {
        title: 'Manage Inventory - Admin',
        products,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const { name, brand, category, price, stock, sizes, description, image, featured } = req.body;
      await productService.createProduct({
        name,
        brand,
        category,
        price,
        stock,
        sizes,
        description,
        image,
        featured: Boolean(featured),
      });

      res.redirect('/admin/products?success=New sneaker model added successfully.');
    } catch (err) {
      res.redirect(`/admin/products?error=${encodeURIComponent(err.message)}`);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      res.redirect('/admin/products?success=Sneaker deleted from catalog.');
    } catch (err) {
      res.redirect(`/admin/products?error=${encodeURIComponent(err.message)}`);
    }
  }

  async renderOrders(req, res, next) {
    try {
      const orders = await orderService.getAllOrders();
      res.render('admin/orders', {
        title: 'Manage Orders - Admin',
        orders,
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
      const { status } = req.body;
      await orderService.updateOrderStatus(id, status);
      res.redirect('/admin/orders?success=Order status updated.');
    } catch (err) {
      res.redirect(`/admin/orders?error=${encodeURIComponent(err.message)}`);
    }
  }

  async renderUsers(req, res, next) {
    try {
      const users = await adminService.getAllUsers();
      res.render('admin/users', {
        title: 'Manage Users - Admin',
        users,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      await adminService.updateUserRole(id, role);
      res.redirect('/admin/users?success=User role updated successfully.');
    } catch (err) {
      res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
    }
  }
}

module.exports = new AdminController();
