const { db, saveDatabase } = require('../config/db');

class Shipment {
  static async find(filter = {}) {
    let results = [...(db.shipments || [])];
    if (filter.shipping_status) {
      results = results.filter((s) => s.shipping_status === filter.shipping_status);
    }
    if (filter.courier_name) {
      results = results.filter((s) => s.courier_name.toLowerCase().includes(filter.courier_name.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (s) =>
          (s.order_number && s.order_number.toLowerCase().includes(q)) ||
          (s.tracking_number && s.tracking_number.toLowerCase().includes(q)) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
          (s.courier_name && s.courier_name.toLowerCase().includes(q)) ||
          (s.origin_hub && s.origin_hub.toLowerCase().includes(q)) ||
          (s.destination_city && s.destination_city.toLowerCase().includes(q))
      );
    }
    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async findById(id) {
    return db.shipments.find((s) => s.id === id || s.tracking_number === id) || null;
  }

  static async updateStatus(id, shipping_status, notes = '') {
    const shipment = db.shipments.find((s) => s.id === id);
    if (!shipment) return null;
    shipment.shipping_status = shipping_status;
    if (shipping_status === 'DELIVERED') {
      shipment.delivered_at = new Date().toISOString();
    }
    shipment.shipping_notes = notes;
    shipment.updated_at = new Date().toISOString();
    saveDatabase();
    return shipment;
  }
}

module.exports = Shipment;
