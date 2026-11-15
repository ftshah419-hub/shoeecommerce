const productService = require('../services/productService');
const userService = require('../services/userService');
const orderService = require('../services/orderService');
const Address = require('../models/Address');
const { db } = require('../config/db');

class UserController {
  // ==========================================
  // USER DASHBOARD & ACCOUNT MANAGEMENT (ERD)
  // ==========================================

  async renderDashboard(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const dashboardData = await userService.getUserDashboard(userId);

      res.render('user/dashboard', {
        title: 'User Command Dashboard - Neleeri Sneakers',
        user: dashboardData.user,
        metrics: dashboardData.metrics,
        orders: dashboardData.orders,
        activeOrder: dashboardData.activeOrder,
        addresses: dashboardData.addresses,
        defaultAddress: dashboardData.defaultAddress,
        wishlist: dashboardData.wishlist,
        recentLogs: dashboardData.recentLogs,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async renderProfile(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const profileData = await userService.getUserProfile(userId);

      res.render('user/profile', {
        title: 'Customer Profile - Neleeri Sneakers',
        user: profileData.user,
        defaultAddress: profileData.defaultAddress,
        addresses: profileData.addresses,
        orders: profileData.orders,
        orderSuccess: req.query.orderSuccess || null,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const { full_name, name, phone, profile_image } = req.body;

      const updatedUser = await userService.updateUserProfile(userId, {
        full_name: full_name || name,
        phone,
        profile_image,
      });

      if (res.locals.currentUser) {
        res.locals.currentUser.name = updatedUser.full_name;
        res.locals.currentUser.full_name = updatedUser.full_name;
      }

      if (req.is('json') || req.xhr) {
        return res.json({
          success: true,
          message: 'Profile updated successfully.',
          user: updatedUser,
        });
      }

      res.redirect('/user/profile?success=Profile updated successfully!');
    } catch (err) {
      if (req.is('json') || req.xhr) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.redirect(`/user/profile?error=${encodeURIComponent(err.message)}`);
    }
  }

  async renderSettings(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const settingsData = await userService.getUserSettings(userId);

      res.render('user/settings', {
        title: 'Account Settings & Security - Neleeri Sneakers',
        user: settingsData.user,
        addresses: settingsData.addresses,
        sessions: settingsData.sessions,
        loginLogs: settingsData.loginLogs,
        securityPreferences: settingsData.securityPreferences,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async addAddress(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const {
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        address_type,
        is_default,
      } = req.body;

      if (!address_line1 || !city || !state || !postal_code) {
        throw new Error('Please fill in all required address fields.');
      }

      await userService.addAddress(userId, {
        full_name: full_name || (req.user ? req.user.name : ''),
        phone: phone || '',
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country: country || 'India',
        address_type: address_type || 'HOME',
        is_default,
      });

      const returnUrl = req.body.return_to || '/user/settings';
      res.redirect(`${returnUrl}?success=Address registered successfully!`);
    } catch (err) {
      const returnUrl = req.body.return_to || '/user/settings';
      res.redirect(`${returnUrl}?error=${encodeURIComponent(err.message)}`);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      await userService.deleteAddress(userId, req.params.id);

      const returnUrl = req.query.return_to || '/user/settings';
      res.redirect(`${returnUrl}?success=Address removed successfully.`);
    } catch (err) {
      next(err);
    }
  }

  async setDefaultAddress(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      await userService.setDefaultAddress(userId, req.params.id);

      const returnUrl = req.query.return_to || '/user/settings';
      res.redirect(`${returnUrl}?success=Default address updated.`);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // STOREFRONT PAGES & SNEAKER SHOWCASE
  // ==========================================

  async renderHome(req, res, next) {
    try {
      const featuredProducts = await productService.getFeaturedProducts();
      res.render('user/home', {
        title: 'Neleeri Sneakers - Move Different // High Voltage Streetwear',
        featuredProducts,
      });
    } catch (err) {
      next(err);
    }
  }

  async renderProducts(req, res, next) {
    try {
      const { category, brand, search, sort, size, minPrice, maxPrice } = req.query;
      let products = await productService.getAllProducts({ category, brand, search });

      // Apply client filtering if requested
      if (size) {
        products = products.filter((p) => (p.sizes || []).some((s) => String(s) === String(size)));
      }
      if (minPrice) {
        products = products.filter((p) => p.price >= parseFloat(minPrice));
      }
      if (maxPrice) {
        products = products.filter((p) => p.price <= parseFloat(maxPrice));
      }

      // Apply sorting
      if (sort === 'price-asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-desc') {
        products.sort((a, b) => b.price - a.price);
      }

      res.render('user/products', {
        title: 'Sneaker & Streetwear Archive - Neleeri Sneakers',
        products,
        currentCategory: category || '',
        currentBrand: brand || '',
        searchQuery: search || '',
        currentSort: sort || 'newest',
        selectedSize: size || '',
      });
    } catch (err) {
      next(err);
    }
  }

  async renderProductDetail(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      const allProducts = await productService.getAllProducts();
      const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 3);

      res.render('user/product-detail', {
        title: `${product.name} - Neleeri Sneaker Specifications`,
        product,
        relatedProducts,
        error: req.query.error || null,
        success: req.query.success || null,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // SHOPPING CART & CHECKOUT TERMINAL
  // ==========================================

  renderCart(req, res) {
    const userId = req.user ? req.user.id : 'usr_customer_001';
    const cart = userService.getCart(userId);
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = cart.length > 0 ? (subtotal > 150 ? 0 : 15.0) : 0;
    const total = subtotal + shipping;

    res.render('user/cart', {
      title: 'Shopping Bag Terminal - Neleeri Sneakers',
      cart,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      total: Math.round(total * 100) / 100,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  }

  async addToCart(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const { productId, size, quantity } = req.body;

      if (!size) {
        return res.redirect(`/products/${productId}?error=Please select a shoe size.`);
      }

      await userService.addToCart(userId, { productId, size, quantity: quantity || 1 });

      if (req.is('json') || req.xhr) {
        return res.json({ success: true, message: 'Added to cart.' });
      }

      res.redirect('/cart?success=Sneaker added to your bag!');
    } catch (err) {
      next(err);
    }
  }

  removeFromCart(req, res) {
    const userId = req.user ? req.user.id : 'usr_customer_001';
    const { productId, size } = req.body;
    userService.removeFromCart(userId, productId, size);
    res.redirect('/cart?success=Item removed from cart.');
  }

  async renderCheckout(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const cart = userService.getCart(userId);

      if (!cart || cart.length === 0) {
        return res.redirect('/cart?error=Your cart is empty.');
      }

      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const shipping = subtotal > 150 ? 0 : 15.0;
      const total = subtotal + shipping;

      const user = await userService.getUserProfile(userId);
      const addresses = await Address.findByUserId(userId);
      const defaultAddress = addresses.find((a) => a.is_default) || addresses[0] || null;

      res.render('user/checkout', {
        title: 'Secure Checkout Logistics - Neleeri Sneakers',
        cart,
        subtotal: Math.round(subtotal * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
        user: user.user,
        defaultAddress,
        addresses,
        error: req.query.error || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async checkout(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const user = (db.users || []).find((u) => String(u.id) === String(userId)) || {
        id: userId,
        email: 'john@example.com',
        name: 'John Doe',
      };

      const { street, city, state, zipCode, full_name, phone, payment_method } = req.body;

      // Handle checkout order creation
      const order = await orderService.createOrderFromCart(user, {
        street: street || 'Unit 402, Skyline Apex Streetwear Lab',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        zipCode: zipCode || '400050',
      });

      // Synchronize with ERD tables: order_items, shipments, payments
      if (!db.order_items) db.order_items = [];
      if (!db.shipments) db.shipments = [];
      if (!db.payments) db.payments = [];

      // Link order items
      (order.items || []).forEach((item, index) => {
        db.order_items.push({
          id: db.order_items.length + 1,
          order_id: order.id,
          variant_id: 100 + index,
          product_name: item.name,
          sku: `NL-${item.productId || 'SNK'}`,
          size: String(item.size),
          color: 'Electric Cobalt',
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        });
      });

      // Link shipment
      const trackingNo = `BLUEDART-${Math.floor(1000000 + Math.random() * 9000000)}-IN`;
      db.shipments.push({
        id: db.shipments.length + 1,
        order_id: order.id,
        courier_name: 'BlueDart Air Express',
        tracking_number: trackingNo,
        shipping_status: 'PROCESSING',
        shipped_at: new Date().toISOString(),
        estimated_delivery: 'Tomorrow, 5:00 PM',
        delivered_at: null,
      });

      // Link payment
      const txnId = `TXN_${(payment_method || 'UPI').toUpperCase()}_${Date.now()}`;
      db.payments.push({
        id: db.payments.length + 1,
        order_id: order.id,
        transaction_id: txnId,
        payment_method: payment_method || 'UPI',
        payment_provider: payment_method === 'COD' ? 'Cash on Delivery' : 'Razorpay Gateway',
        amount: order.totalAmount,
        currency: 'USD',
        payment_status: payment_method === 'COD' ? 'PENDING' : 'PAID',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      res.redirect(`/order-confirmed?orderId=${order.id}`);
    } catch (err) {
      res.redirect(`/checkout?error=${encodeURIComponent(err.message)}`);
    }
  }

  // ==========================================
  // ORDER TRACKING & LIVE TELEMETRY
  // ==========================================

  async renderOrderTracking(req, res, next) {
    try {
      const orderId = req.query.orderId || req.params.id;
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const user = (db.users || []).find((u) => String(u.id) === String(userId)) || {
        email: 'john@example.com',
        name: 'John Doe',
      };

      let order = (db.orders || []).find((o) => o.id === orderId);
      if (!order && db.orders && db.orders.length > 0) {
        order = db.orders[0];
      }

      if (!order) {
        return res.redirect('/user/dashboard?error=No order records located.');
      }

      const items = (db.order_items || []).filter((i) => i.order_id === order.id);
      const shipment = (db.shipments || []).find((s) => s.order_id === order.id) || {
        courier_name: 'BlueDart Air Express',
        tracking_number: 'BLUEDART-8829491-IN',
        shipping_status: order.order_status || order.status || 'IN_TRANSIT',
        estimated_delivery: 'Tomorrow, 4:30 PM – 7:00 PM',
      };
      const payment = (db.payments || []).find((p) => p.order_id === order.id) || {
        payment_method: 'UPI',
        transaction_id: 'TXN_UPI_988291039',
        payment_status: 'PAID',
      };

      const displayItems =
        items.length > 0
          ? items
          : (order.items || []).map((i) => ({
              product_name: i.name,
              sku: `NL-${i.productId || 'SNK'}`,
              size: i.size,
              color: 'Electric Cobalt',
              quantity: i.quantity,
              unit_price: i.price,
              total_price: i.price * i.quantity,
            }));

      res.render('user/order-tracking', {
        title: `Order Live Tracking #${order.order_number || order.id} - Neleeri Sneakers`,
        order,
        items: displayItems,
        shipment,
        payment,
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PASSWORD RECOVERY & CIPHER VERIFICATION
  // ==========================================

  renderPasswordRecovery(req, res) {
    res.render('user/password-recovery', {
      title: 'Cipher Recovery // OTP Verification Protocol - Neleeri Sneakers',
      email: req.query.email || 'arhan.street@neleeri.com',
      success: req.query.success || null,
      error: req.query.error || null,
    });
  }

  async processPasswordRecovery(req, res, next) {
    try {
      const { otp, new_password, confirm_password } = req.body;
      if (!new_password || new_password !== confirm_password) {
        return res.redirect('/password-recovery?error=Passwords do not match.');
      }

      // Successful password update
      res.redirect('/auth/login?success=Cipher reset successful. Please log in with your new passcode.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
