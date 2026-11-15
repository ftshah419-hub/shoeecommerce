const productService = require('../services/productService');
const userService = require('../services/userService');
const orderService = require('../services/orderService');

class UserController {
  // ==========================================
  // USER DASHBOARD & ACCOUNT MANAGEMENT (ERD)
  // ==========================================

  /**
   * GET /user/dashboard
   * Renders the tactical User Command Dashboard with real-time metrics,
   * active dispatches, recent orders manifest, and quick actions.
   */
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

  /**
   * GET /user/profile
   * Renders the User Profile and Identity management view matching ERD schema
   */
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

  /**
   * POST or PUT /user/profile
   * Updates user profile fields matching ERD columns (full_name, phone, profile_image)
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'usr_customer_001';
      const { full_name, name, phone, profile_image } = req.body;

      const updatedUser = await userService.updateUserProfile(userId, {
        full_name: full_name || name,
        phone,
        profile_image,
      });

      // Update current user in res.locals if present
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

  /**
   * GET /user/settings
   * Renders User Account Settings, Address Book, Security & Session matrix
   */
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

  /**
   * POST /user/addresses
   * Adds a new delivery coordinate to the addresses table
   */
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

  /**
   * POST /user/addresses/:id/delete
   * Removes an address from addresses table
   */
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

  /**
   * POST /user/addresses/:id/default
   * Sets target address as default
   */
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
  // STOREFRONT PUBLIC PAGES & CART LOGIC
  // ==========================================

  async renderHome(req, res, next) {
    try {
      const featuredProducts = await productService.getFeaturedProducts();
      res.render('user/home', {
        title: 'Neleeri Sneakers - Premium Footwear & Streetwear',
        featuredProducts,
      });
    } catch (err) {
      next(err);
    }
  }

  async renderProducts(req, res, next) {
    try {
      const { category, brand, search } = req.query;
      const products = await productService.getAllProducts({ category, brand, search });
      res.render('user/products', {
        title: 'All Sneakers - Neleeri Sneakers',
        products,
        currentCategory: category || '',
        currentBrand: brand || '',
        searchQuery: search || '',
      });
    } catch (err) {
      next(err);
    }
  }

  async renderProductDetail(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.render('user/product-detail', {
        title: `${product.name} - Neleeri Sneakers`,
        product,
      });
    } catch (err) {
      next(err);
    }
  }

  renderCart(req, res) {
    const userId = req.user ? req.user.id : 'guest_session';
    const cart = userService.getCart(userId);
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = cart.length > 0 ? (subtotal > 150 ? 0 : 15.0) : 0;
    const total = subtotal + shipping;

    res.render('user/cart', {
      title: 'Shopping Cart - Neleeri Sneakers',
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
      const userId = req.user ? req.user.id : 'guest_session';
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
    const userId = req.user ? req.user.id : 'guest_session';
    const { productId, size } = req.body;
    userService.removeFromCart(userId, productId, size);
    res.redirect('/cart?success=Item removed from cart.');
  }

  async checkout(req, res, next) {
    try {
      const { street, city, state, zipCode } = req.body;
      const order = await orderService.createOrderFromCart(req.user, {
        street,
        city,
        state,
        zipCode,
      });

      res.redirect(`/user/profile?orderSuccess=${order.id}`);
    } catch (err) {
      res.redirect(`/cart?error=${encodeURIComponent(err.message)}`);
    }
  }
}

module.exports = new UserController();
