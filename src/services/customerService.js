const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const AdminActivityLog = require('../models/AdminActivityLog');
const { db } = require('../config/db');

class CustomerService {
  async getAllCustomers(query = {}) {
    const users = await User.find(query);
    // Filter to customers only
    const customers = users.filter((u) => u.role === 'user' || u.role === 'customer');

    // Attach order count and total spent
    return customers.map((c) => {
      const userOrders = (db.orders || []).filter((o) => o.user_id === c.id || o.userId === c.id);
      const totalSpent = userOrders.reduce((sum, o) => sum + (parseFloat(o.final_amount || o.totalAmount) || 0), 0);
      return {
        ...c,
        orderCount: userOrders.length,
        totalSpent,
      };
    });
  }

  async getCustomerProfile(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error(`Customer with ID "${id}" was not found.`);
    }

    const addresses = (db.addresses || []).filter((a) => a.user_id === user.id);
    const orders = (db.orders || []).filter((o) => o.user_id === user.id || o.userId === user.id);
    const reviews = (db.reviews || []).filter((r) => r.user_id === user.id);

    const totalSpent = orders.reduce((sum, o) => sum + (parseFloat(o.final_amount || o.totalAmount) || 0), 0);

    return {
      customer: {
        ...user,
        totalSpent,
        orderCount: orders.length,
      },
      addresses,
      orders,
      reviews,
    };
  }

  async updateCustomerStatus(id, account_status, adminUser = null, ip = null) {
    const valid = ['ACTIVE', 'SUSPENDED', 'PENDING'];
    if (!valid.includes(account_status)) {
      throw new Error(`Invalid status "${account_status}".`);
    }

    const user = await User.findById(id);
    if (!user) throw new Error('Customer account not found.');

    const updated = await User.update(id, { account_status });

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_CUSTOMER_STATUS',
        module: 'CUSTOMER_SQUAD',
        details: `Updated customer "${user.name}" status to "${account_status}"`,
        ip_address: ip,
      });
    }

    return updated;
  }
}

module.exports = new CustomerService();
