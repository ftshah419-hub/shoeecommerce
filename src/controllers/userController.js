const productService = require('../services/productService');
const userService = require('../services/userService');
const orderService = require('../services/orderService');

class UserController {
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

      res.redirect(`/profile?orderSuccess=${order.id}`);
    } catch (err) {
      res.redirect(`/cart?error=${encodeURIComponent(err.message)}`);
    }
  }

  async renderProfile(req, res, next) {
    try {
      const orders = await userService.getUserOrders(req.user.id);
      res.render('user/profile', {
        title: 'My Profile - Neleeri Sneakers',
        user: req.user,
        orders,
        orderSuccess: req.query.orderSuccess || null,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
