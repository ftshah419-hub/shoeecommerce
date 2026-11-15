const Order = require('../models/Order');
const Product = require('../models/Product');
const userService = require('./userService');
const ORDER_STATUS = require('../constants/orderStatus');

class OrderService {
  async createOrderFromCart(user, shippingAddress) {
    const cart = userService.getCart(user.id);
    if (!cart || cart.length === 0) {
      throw new Error('Your cart is empty.');
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      throw new Error('A valid shipping address is required.');
    }

    // Verify stock and calculate total
    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of cart) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product "${item.name}" is no longer available.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
      }

      totalAmount += product.price * item.quantity;
      verifiedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        size: item.size,
        quantity: item.quantity,
      });

      // Deduct stock
      await Product.update(product.id, {
        stock: product.stock - item.quantity,
      });
    }

    const order = await Order.create({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      items: verifiedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      shippingAddress,
      status: ORDER_STATUS.PROCESSING,
    });

    // Clear cart after successful checkout
    userService.clearCart(user.id);

    return order;
  }

  async getOrderById(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }
    return order;
  }

  async getAllOrders() {
    return Order.find();
  }

  async updateOrderStatus(orderId, status) {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new Error(`Invalid order status: ${status}`);
    }

    const order = await Order.updateStatus(orderId, status);
    if (!order) {
      throw new Error('Order not found.');
    }
    return order;
  }
}

module.exports = new OrderService();
