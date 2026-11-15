const { db, saveDatabase } = require('../config/db');

class Payment {
  static async find(filter = {}) {
    let results = [...(db.payments || [])];
    if (filter.status) {
      results = results.filter((p) => p.status === filter.status);
    }
    if (filter.payment_method) {
      results = results.filter((p) => p.payment_method === filter.payment_method);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (p) =>
          (p.order_number && p.order_number.toLowerCase().includes(q)) ||
          (p.transaction_id && p.transaction_id.toLowerCase().includes(q)) ||
          (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
          (p.payment_gateway && p.payment_gateway.toLowerCase().includes(q))
      );
    }
    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async findById(id) {
    return db.payments.find((p) => p.id === id || p.transaction_id === id) || null;
  }

  static async updateStatus(id, status, notes = '') {
    const payment = db.payments.find((p) => p.id === id);
    if (!payment) return null;
    payment.status = status;
    payment.notes = notes;
    payment.updated_at = new Date().toISOString();
    saveDatabase();
    return payment;
  }
}

module.exports = Payment;
