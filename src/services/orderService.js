const Order = require('../models/Order');
const Product = require('../models/Product');
const userService = require('./userService');
const AdminActivityLog = require('../models/AdminActivityLog');
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
        image: product.image,
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

  async getAllOrders(query = {}) {
    return Order.find(query);
  }

  async getOrderById(id) {
    const order = await Order.findById(id);
    if (!order) {
      throw new Error(`Order reference "${id}" not found.`);
    }
    return order;
  }

  async updateOrderStatus(id, status, adminUser = null, ip = null) {
    const order = await this.getOrderById(id);
    const updated = await Order.updateStatus(order.id, status);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_ORDER_STATUS',
        module: 'OPERATIONS',
        details: `Updated Order #${order.order_number} status to "${status}"`,
        ip_address: ip,
      });
    }

    return updated;
  }

  async bulkDispatch(orderIds = [], courierName = 'Bluedart Priority Aviation', adminUser = null, ip = null) {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('Please select at least one order for bulk dispatch.');
    }

    const updated = await Order.bulkDispatch(orderIds, courierName);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'BULK_DISPATCH',
        module: 'OPERATIONS',
        details: `Dispatched ${updated.length} orders via ${courierName}`,
        ip_address: ip,
      });
    }

    return updated;
  }

  async getOrderInvoiceData(id) {
    const order = await this.getOrderById(id);
    const items = order.items || [];
    const subtotal = order.totalAmount || 0;
    const tax = Math.round((subtotal * 0.18) * 100) / 100;
    const discount = order.discount_amount || 0;
    const grandTotal = subtotal;

    return {
      order,
      items,
      subtotal,
      tax,
      discount,
      grandTotal,
      invoiceDate: new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      invoiceNumber: `INV-${order.order_number.replace(/\D/g, '')}`,
    };
  }

  async getOrderShippingLabelData(id) {
    const order = await this.getOrderById(id);
    return {
      order,
      courierName: order.courier_name || 'Bluedart Priority Aviation',
      trackingNumber: order.tracking_number || `BLD-EXP-${Math.floor(100 + Math.random() * 900)}`,
      destinationCity: order.destination_pincode ? 'MUMBAI / DEL / BLR' : 'INDIA EXPRESS',
    };
  }
}

module.exports = new OrderService();
