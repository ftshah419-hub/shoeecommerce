const Payment = require('../models/Payment');
const AdminActivityLog = require('../models/AdminActivityLog');
const { db } = require('../config/db');

class PaymentService {
  async getAllPayments(query = {}) {
    const payments = await Payment.find(query);
    const totalVolume = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const successfulCount = payments.filter((p) => p.status === 'SUCCESS').length;
    const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
    const failedCount = payments.filter((p) => p.status === 'FAILED').length;

    return {
      payments,
      totalVolume,
      successfulCount,
      pendingCount,
      failedCount,
    };
  }

  async getPaymentById(id) {
    const payment = await Payment.findById(id);
    if (!payment) throw new Error(`Payment record "${id}" not found.`);
    return payment;
  }

  async updatePaymentStatus(id, status, notes = '', adminUser = null, ip = null) {
    const payment = await this.getPaymentById(id);
    const updated = await Payment.updateStatus(id, status, notes);

    // Sync order if payment status changes
    const order = db.orders.find((o) => o.id === payment.order_id || o.order_number === payment.order_number);
    if (order) {
      if (status === 'SUCCESS') order.payment_status = 'PAID';
      if (status === 'FAILED') order.payment_status = 'FAILED';
      if (status === 'REFUNDED') order.payment_status = 'REFUNDED';
    }

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_PAYMENT_STATUS',
        module: 'OPERATIONS',
        details: `Updated Payment ${payment.transaction_id} (Order #${payment.order_number}) status to "${status}"`,
        ip_address: ip,
      });
    }

    return updated;
  }
}

module.exports = new PaymentService();
