const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

class AdminService {
  async getDashboardAnalytics() {
    const users = await User.find();
    const products = await Product.find();
    const orders = await Order.find();

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrdersCount = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PENDING').length;

    return {
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingOrdersCount,
      recentOrders: orders.slice(0, 5),
    };
  }

  async getAllUsers() {
    return User.find();
  }

  async updateUserRole(userId, newRole) {
    const validRoles = ['admin', 'user'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Role "${newRole}" is invalid.`);
    }

    const updated = await User.update(userId, { role: newRole });
    if (!updated) {
      throw new Error('User not found.');
    }
    const { password, ...safeUser } = updated;
    return safeUser;
  }
}

module.exports = new AdminService();
