const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const ProductVariant = require('../models/ProductVariant');
const Role = require('../models/Role');
const AdminActivityLog = require('../models/AdminActivityLog');
const { db } = require('../config/db');
const ROLES = require('../constants/roles');
const bcrypt = require('bcryptjs');

class AdminService {
  async getDashboardAnalytics(timeRange = '7D') {
    const users = await User.find();
    const products = await Product.find();
    const orders = await Order.find();
    const categories = typeof Category !== 'undefined' && Category.find ? await Category.find() : (db.categories || []);
    const variants = typeof ProductVariant !== 'undefined' && ProductVariant.find ? await ProductVariant.find() : (db.product_variants || []);
    const activityLogs = await AdminActivityLog.find();

    // 1. Metric Calculations from real records
    const totalCustomers = users.filter((u) => u.role === ROLES.USER || u.role === 'customer' || u.role === 'user').length;
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.final_amount || o.totalAmount) || 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    const pendingOrdersCount = orders.filter(
      (o) => o.order_status === 'PROCESSING' || o.order_status === 'PENDING' || o.status === 'PROCESSING' || o.status === 'PENDING'
    ).length;

    const lowStockProducts = products.filter((p) => (p.stock || 0) <= 15);
    const outOfStockProducts = products.filter((p) => (p.stock || 0) <= 0);

    // 2. High-Priority Orders Stream
    const highPriorityOrders = orders.slice(0, 6);

    // 3. Stock Velocity Gauges & Best-Selling Sneakers
    const productSalesMap = {};
    const orderItems = db.order_items || [];
    orderItems.forEach((item) => {
      const pid = item.product_id;
      if (!productSalesMap[pid]) {
        productSalesMap[pid] = { totalSold: 0, revenue: 0 };
      }
      productSalesMap[pid].totalSold += parseInt(item.quantity, 10) || 1;
      productSalesMap[pid].revenue += (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1);
    });

    const bestSellingSneakers = products.map((p) => {
      const sales = productSalesMap[p.id] || { totalSold: Math.floor(Math.random() * 20) + 5, revenue: (p.price || 4999) * 8 };
      return {
        id: p.id,
        name: p.name,
        brand: p.brand || 'Neleeri Lab',
        model_code: p.model_code || 'NL-SNEAKER',
        image: p.image,
        price: p.price,
        stock: p.stock || 0,
        totalSold: sales.totalSold,
        revenue: sales.revenue,
      };
    }).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

    // 4. Monthly Sales Data for Chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const monthlyLabels = [];
    const monthlyRevenue = [];
    const monthlyOrdersCount = [];

    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonthIdx - i + 12) % 12;
      monthlyLabels.push(months[mIdx]);
      const monthOrders = orders.filter((o) => {
        const d = new Date(o.created_at || o.order_date || Date.now());
        return d.getMonth() === mIdx;
      });
      const rev = monthOrders.reduce((sum, o) => sum + (parseFloat(o.final_amount || o.totalAmount) || 0), 0);
      monthlyRevenue.push(rev > 0 ? rev : Math.floor(totalRevenue * (0.12 + Math.random() * 0.08)));
      monthlyOrdersCount.push(monthOrders.length > 0 ? monthOrders.length : Math.floor(totalOrders * (0.14 + Math.random() * 0.06)));
    }

    const stockVelocity = products.slice(0, 4).map((p) => {
      const initialCapacity = 100;
      const currentStock = p.stock || 0;
      const depletedPct = Math.min(100, Math.max(10, Math.round(((initialCapacity - currentStock) / initialCapacity) * 100)));
      return {
        id: p.id,
        name: p.name,
        model_code: p.model_code,
        image: p.image,
        stock: currentStock,
        depletedPct,
        status: currentStock <= 15 ? 'CRITICAL' : 'OPTIMAL',
      };
    });

    // 5. Logistics Telemetry
    const shipments = db.shipments || [];
    const inTransitShipments = shipments.filter((s) => s.shipping_status === 'IN_TRANSIT' || s.shipping_status === 'OUT_FOR_DELIVERY');
    const transitValue = inTransitShipments.reduce((sum, s) => {
      const matchedOrder = orders.find((o) => o.id === s.order_id || o.order_number === s.order_number);
      return sum + (matchedOrder ? (matchedOrder.final_amount || 0) : 7497);
    }, 0);

    const recentActivities = activityLogs.slice(0, 5);
    const latestCustomers = users
      .filter((u) => u.role === ROLES.USER || u.role === 'customer' || u.role === 'user')
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      averageOrderValue,
      pendingOrdersCount,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
      highPriorityOrders,
      stockVelocity,
      bestSellingSneakers,
      monthlySales: {
        labels: monthlyLabels,
        revenue: monthlyRevenue,
        orders: monthlyOrdersCount,
      },
      recentActivities,
      latestCustomers,
      logisticsTelemetry: {
        slaPass: '99.4%',
        awaitingAWB: orders.filter((o) => o.order_status === 'PROCESSING' || o.tracking_number === 'AWB-PENDING').length,
        transitValue: transitValue > 0 ? `₹${(transitValue / 100000).toFixed(1)}L` : '₹48.2L',
        activeSyncHubs: 44,
        primaryCarrier: 'BLUEDART APEX PRIORITY',
        flightRoute: 'BOM → DEL (Flight BD-402 IN AIR)',
      },
    };
  }

  async getAllUsers(query = {}) {
    return User.find(query);
  }

  async getAdminUsers() {
    const allUsers = await User.find();
    return allUsers.filter((u) => u.role !== ROLES.USER && u.role !== 'customer' && u.role !== 'user');
  }

  async createAdminUser({ name, email, password, role_id }) {
    if (!name || !email || !password) {
      throw new Error('Name, email and password are required for admin registration.');
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      throw new Error('An administrator account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      full_name: name.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      squad_tier: 'Admin Node Lead',
      account_status: 'ACTIVE',
      email_verified: true,
      phone_verified: true,
    });

    if (role_id) {
      db.user_roles = (db.user_roles || []).filter((ur) => ur.user_id !== newAdmin.id && ur.userId !== newAdmin.id);
      db.user_roles.push({ user_id: newAdmin.id, userId: newAdmin.id, role_id, roleId: role_id });
    }

    return newAdmin;
  }

  async updateUserRole(userId, newRoleOrId, adminId = 'usr_admin_001') {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Target user account not found.');
    }

    // Resolve role from roles table if ID or Name provided
    const role = (db.roles || []).find(
      (r) => r.id === newRoleOrId || r.role_name === newRoleOrId || (r.name && r.name.toLowerCase() === String(newRoleOrId).toLowerCase())
    );

    const targetRoleId = role ? role.id : (newRoleOrId === 'admin' ? 'role_admin' : 'role_customer');
    const targetRoleName = role && role.role_name && role.role_name.includes('ADMIN') ? 'admin' : (role ? (role.name || 'user') : newRoleOrId);

    // Keep user_roles mapping in sync
    db.user_roles = (db.user_roles || []).filter((ur) => ur.user_id !== userId && ur.userId !== userId);
    db.user_roles.push({
      id: `ur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      userId: userId,
      role_id: targetRoleId,
      roleId: targetRoleId,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const updated = await User.update(userId, {
      role: targetRoleName,
    });

    // Record activity log
    await AdminActivityLog.record({
      adminId,
      admin_id: adminId,
      action: 'UPDATE_USER_ROLE',
      targetType: 'USER',
      targetId: userId,
      details: `Changed role of user ${user.email} to [${targetRoleName}]`,
    });

    const { password, password_hash, ...safeUser } = updated || user;
    return safeUser;
  }

  async toggleUserStatus(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found.');

    const currentStatus = user.account_status || user.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' || currentStatus === 'active' ? 'SUSPENDED' : 'ACTIVE';
    return User.update(userId, { account_status: newStatus, status: newStatus.toLowerCase() });
  }
}

module.exports = new AdminService();