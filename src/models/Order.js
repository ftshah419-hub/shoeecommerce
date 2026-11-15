const { db } = require('../config/db');

class Order {
  static async find(filter = {}) {
    let results = [...db.orders];
    if (filter.userId) {
      results = results.filter((o) => o.userId === filter.userId);
    }
    if (filter.status) {
      results = results.filter((o) => o.status === filter.status);
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    return db.orders.find((o) => o.id === id) || null;
  }

  static async create(orderData) {
    const newOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      ...orderData,
    };
    db.orders.push(newOrder);
    return newOrder;
  }

  static async updateStatus(id, status) {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return order;
  }
}

module.exports = Order;
