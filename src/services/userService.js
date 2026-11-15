const { db } = require('../config/db');
const Product = require('../models/Product');
const Order = require('../models/Order');

class UserService {
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
