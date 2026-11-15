const { db } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Address = require('../models/Address');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');

class UserService {
  constructor() {
    this._ensureSeededData();
  }

  _ensureSeededData() {
    if (!db.addresses) db.addresses = [];
    if (!db.wishlists) db.wishlists = [];
    if (!db.wishlist_items) db.wishlist_items = [];
    if (!db.reviews) db.reviews = [];
    if (!db.user_sessions) db.user_sessions = [];
    if (!db.login_logs) db.login_logs = [];
    if (!db.order_items) db.order_items = [];
    if (!db.shipments) db.shipments = [];
    if (!db.payments) db.payments = [];

    // Ensure sample user data exists for demo user usr_customer_001
    const demoUserId = 'usr_customer_001';

    // Seed Addresses if empty
    if (db.addresses.length === 0) {
      db.addresses.push(
        {
          id: 1,
          user_id: demoUserId,
          full_name: 'John Doe',
          phone: '+91 98200 12345',
          address_line1: 'Unit 402, Skyline Apex Streetwear Lab',
          address_line2: 'Pali Hill, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400050',
          country: 'India',
          address_type: 'WORK',
          is_default: true,
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
        {
          id: 2,
          user_id: demoUserId,
          full_name: 'John Doe',
          phone: '+91 98200 12345',
          address_line1: '#18, 80 Feet Main Road',
          address_line2: 'Koramangala 4th Block',
          city: 'Bengaluru',
          state: 'Karnataka',
          postal_code: '560034',
          country: 'India',
          address_type: 'STUDIO',
          is_default: false,
          created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        }
      );
    }

    // Seed Wishlist if empty
    if (db.wishlists.length === 0) {
      db.wishlists.push({
        id: 1,
        user_id: demoUserId,
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      });
      db.wishlist_items.push(
        {
          id: 1,
          wishlist_id: 1,
          product_id: 'snk_002',
          added_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
          id: 2,
          wishlist_id: 1,
          product_id: 'snk_004',
          added_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        }
      );
    }

    // Seed Order Items, Shipments, and Payments for initial seeded order
    if (db.orders && db.orders.length > 0 && db.order_items.length === 0) {
      const firstOrder = db.orders[0];
      firstOrder.user_id = firstOrder.userId || demoUserId;
      firstOrder.address_id = 1;
      firstOrder.order_number = firstOrder.order_number || 'NL-88294';
      firstOrder.subtotal = 159.99;
      firstOrder.discount_amount = 0.0;
      firstOrder.shipping_charge = 0.0;
      firstOrder.tax_amount = 0.0;
      firstOrder.total_amount = firstOrder.totalAmount || 159.99;
      firstOrder.currency = 'USD';
      firstOrder.order_status = 'IN_TRANSIT';
      firstOrder.payment_status = 'PAID';
      firstOrder.created_at = firstOrder.createdAt || new Date().toISOString();

      db.order_items.push({
        id: 1,
        order_id: firstOrder.id,
        variant_id: 101,
        product_name: 'Neleeri Air Velocity 90',
        sku: 'NL-SNK-001-BLU-10',
        size: '10',
        color: 'Cobalt Cyber',
        quantity: 1,
        unit_price: 159.99,
        total_price: 159.99,
      });

      db.shipments.push({
        id: 1,
        order_id: firstOrder.id,
        courier_name: 'BlueDart Air Express',
        tracking_number: 'BLUEDART-8829491-IN',
        shipping_status: 'IN_TRANSIT',
        shipped_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        estimated_delivery: new Date(Date.now() + 86400000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        delivered_at: null,
      });

      db.payments.push({
        id: 1,
        order_id: firstOrder.id,
        transaction_id: 'TXN_UPI_988291039',
        payment_method: 'UPI',
        payment_provider: 'Razorpay / GPay',
        amount: 159.99,
        currency: 'USD',
        payment_status: 'PAID',
        paid_at: firstOrder.created_at,
        created_at: firstOrder.created_at,
      });

      // Add a delivered historical order matching Stitch design
      const deliveredOrderId = 'ord_1002';
      if (!db.orders.find((o) => o.id === deliveredOrderId)) {
        db.orders.push({
          id: deliveredOrderId,
          user_id: demoUserId,
          userId: demoUserId,
          address_id: 1,
          order_number: 'NL-74102',
          subtotal: 139.99,
          discount_amount: 0.0,
          shipping_charge: 0.0,
          tax_amount: 0.0,
          total_amount: 139.99,
          totalAmount: 139.99,
          currency: 'USD',
          order_status: 'DELIVERED',
          status: 'DELIVERED',
          payment_status: 'PAID',
          created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          items: [
            {
              productId: 'snk_003',
              name: 'Neleeri Retro Court High',
              price: 139.99,
              size: 9.5,
              quantity: 1,
            },
          ],
        });

        db.order_items.push({
          id: 2,
          order_id: deliveredOrderId,
          variant_id: 103,
          product_name: 'Neleeri Retro Court High',
          sku: 'NL-SNK-003-WHT-09',
          size: '9.5',
          color: 'Vintage Chalk White',
          quantity: 1,
          unit_price: 139.99,
          total_price: 139.99,
        });

        db.shipments.push({
          id: 2,
          order_id: deliveredOrderId,
          courier_name: 'Delhivery Surface',
          tracking_number: 'DLHV-7410283-IN',
          shipping_status: 'DELIVERED',
          shipped_at: new Date(Date.now() - 86400000 * 18).toISOString(),
          estimated_delivery: new Date(Date.now() - 86400000 * 15).toISOString(),
          delivered_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        });
      }
    }

    // Seed Sessions & Logs
    if (db.user_sessions.length === 0) {
      db.user_sessions.push({
        id: 1,
        user_id: demoUserId,
        session_token_hash: 'sess_live_mumbai_apex_node',
        ip_address: '103.21.244.12',
        device_info: 'Chrome 122 / Windows 11 (Mumbai Apex Node)',
        expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    if (db.login_logs.length === 0) {
      db.login_logs.push(
        {
          id: 1,
          user_id: demoUserId,
          email_attempted: 'john@example.com',
          ip_address: '103.21.244.12',
          device_info: 'Chrome 122 on Windows 11',
          login_status: 'SUCCESS',
          failure_reason: null,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 2,
          user_id: demoUserId,
          email_attempted: 'john@example.com',
          ip_address: '103.21.244.12',
          device_info: 'Chrome 122 on Windows 11',
          login_status: 'SUCCESS',
          failure_reason: null,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        }
      );
    }
  }

  // --- User Profile (M in MVC, querying users & addresses) ---
  async getUserProfile(userId) {
    this._ensureSeededData();
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    const defaultAddress = await Address.findDefaultByUserId(userId);
    const addresses = await Address.findByUserId(userId);
    const orders = await this.getUserOrders(userId);

    return {
      user,
      defaultAddress,
      addresses,
      orders,
    };
  }

  async updateUserProfile(userId, { full_name, phone, profile_image }) {
    this._ensureSeededData();
    const existing = await User.findById(userId);
    if (!existing) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    const updatePayload = {};
    if (full_name !== undefined && full_name.trim() !== '') {
      updatePayload.full_name = full_name.trim();
      updatePayload.name = full_name.trim();
    }
    if (phone !== undefined) {
      updatePayload.phone = phone.trim();
    }
    if (profile_image !== undefined && profile_image.trim() !== '') {
      updatePayload.profile_image = profile_image.trim();
    }

    const updatedUser = await User.update(userId, updatePayload);
    return updatedUser;
  }

  // --- User Dashboard Metrics & Activity (C & M in MVC) ---
  async getUserDashboard(userId) {
    this._ensureSeededData();
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    // Orders with joined items, shipments, payments
    const rawOrders = (db.orders || []).filter(
      (o) => String(o.user_id) === String(userId) || String(o.userId) === String(userId)
    );

    const orders = rawOrders.map((order) => {
      const items = (db.order_items || []).filter((item) => String(item.order_id) === String(order.id));
      const shipment = (db.shipments || []).find((s) => String(s.order_id) === String(order.id)) || null;
      const payment = (db.payments || []).find((p) => String(p.order_id) === String(order.id)) || null;
      const address = (db.addresses || []).find((a) => String(a.id) === String(order.address_id)) || null;

      // Fallback for orders created through simple checkout
      const displayItems =
        items.length > 0
          ? items
          : (order.items || []).map((i, idx) => ({
              id: idx + 1,
              order_id: order.id,
              product_name: i.name,
              sku: `NL-${i.productId || 'SNK'}`,
              size: String(i.size),
              color: 'Standard Edition',
              quantity: i.quantity,
              unit_price: i.price,
              total_price: i.price * i.quantity,
            }));

      return {
        id: order.id,
        user_id: order.user_id || order.userId,
        address_id: order.address_id || null,
        order_number: order.order_number || `#NL-${order.id.replace('ord_', '')}`,
        subtotal: order.subtotal || order.totalAmount || 0,
        discount_amount: order.discount_amount || 0,
        shipping_charge: order.shipping_charge || 0,
        tax_amount: order.tax_amount || 0,
        total_amount: order.total_amount || order.totalAmount || 0,
        currency: order.currency || 'USD',
        order_status: order.order_status || order.status || 'PROCESSING',
        payment_status: order.payment_status || 'PAID',
        created_at: order.created_at || order.createdAt || new Date().toISOString(),
        items: displayItems,
        shipment,
        payment,
        address,
      };
    });

    // Sort orders newest first
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Active order (in-transit or processing)
    const activeOrder =
      orders.find((o) => o.order_status === 'IN_TRANSIT' || o.order_status === 'PROCESSING') || orders[0] || null;

    // Wishlist items
    const wishlistItems = await Wishlist.getItemsWithProducts(userId);

    // Saved Addresses
    const addresses = await Address.findByUserId(userId);
    const defaultAddress = addresses.find((a) => a.is_default) || addresses[0] || null;

    // Tactical Metrics calculation
    const totalOrders = orders.length;
    const activeOrders = orders.filter((o) => ['IN_TRANSIT', 'PROCESSING', 'PENDING'].includes(o.order_status)).length;
    const deliveredOrders = orders.filter((o) => o.order_status === 'DELIVERED').length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const wishlistCount = wishlistItems.length;

    // Street Cred loyalty points (base 1500 + 10 points per dollar spent)
    const streetCredPoints = Math.round(1500 + totalSpent * 10);

    return {
      user,
      metrics: {
        streetCredPoints,
        totalOrders,
        activeOrders,
        deliveredOrders,
        totalSpent: Math.round(totalSpent * 100) / 100,
        wishlistCount,
      },
      orders,
      activeOrder,
      addresses,
      defaultAddress,
      wishlist: wishlistItems,
      recentLogs: (db.login_logs || []).filter((l) => String(l.user_id) === String(userId)).slice(0, 3),
    };
  }

  // --- Address Management (addresses table) ---
  async getUserAddresses(userId) {
    this._ensureSeededData();
    return Address.findByUserId(userId);
  }

  async addAddress(userId, addressData) {
    this._ensureSeededData();
    const newAddress = await Address.create({
      user_id: userId,
      full_name: addressData.full_name,
      phone: addressData.phone,
      address_line1: addressData.address_line1,
      address_line2: addressData.address_line2 || '',
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postal_code,
      country: addressData.country || 'India',
      address_type: addressData.address_type || 'HOME',
      is_default: addressData.is_default === 'on' || addressData.is_default === true,
    });
    return newAddress;
  }

  async deleteAddress(userId, addressId) {
    this._ensureSeededData();
    return Address.delete(addressId, userId);
  }

  async setDefaultAddress(userId, addressId) {
    this._ensureSeededData();
    return Address.setDefault(addressId, userId);
  }

  // --- Settings & Security Preferences ---
  async getUserSettings(userId) {
    this._ensureSeededData();
    const user = await User.findById(userId);
    const addresses = await Address.findByUserId(userId);
    const sessions = (db.user_sessions || []).filter((s) => String(s.user_id) === String(userId));
    const loginLogs = (db.login_logs || []).filter((l) => String(l.user_id) === String(userId));

    return {
      user,
      addresses,
      sessions,
      loginLogs,
      securityPreferences: {
        twoFactorActive: user.phone_verified,
        encryption: 'TLS 1.3 // SHA-256',
        preferredFootwearSize: 'UK 9.0 (EU 43.5)',
        preferredApparelSize: 'L (Oversized)',
      },
    };
  }

  // --- Storefront Cart Operations (Backward Compatible) ---
  getCart(userId) {
    if (!db.carts[userId]) {
      db.carts[userId] = [];
    }
    return db.carts[userId];
  }

  async addToCart(userId, { productId, size, quantity = 1 }) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    const cart = this.getCart(userId);
    const existingIndex = cart.findIndex(
      (item) => item.productId === productId && Number(item.size) === Number(size)
    );

    const qty = parseInt(quantity, 10) || 1;

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: Number(size),
        quantity: qty,
      });
    }

    return cart;
  }

  removeFromCart(userId, productId, size) {
    const cart = this.getCart(userId);
    db.carts[userId] = cart.filter(
      (item) => !(item.productId === productId && Number(item.size) === Number(size))
    );
    return db.carts[userId];
  }

  clearCart(userId) {
    db.carts[userId] = [];
  }

  async getUserOrders(userId) {
    return Order.find({ userId });
  }
}

module.exports = new UserService();
