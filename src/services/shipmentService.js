const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const AdminActivityLog = require('../models/AdminActivityLog');
const { db } = require('../config/db');

class ShipmentService {
  async getAllShipments(query = {}) {
    const shipments = await Shipment.find(query);
    const inTransitCount = shipments.filter((s) => s.shipping_status === 'IN_TRANSIT').length;
    const deliveredCount = shipments.filter((s) => s.shipping_status === 'DELIVERED').length;
    const manifestedCount = shipments.filter((s) => s.shipping_status === 'MANIFESTED').length;

    return {
      shipments,
      inTransitCount,
      deliveredCount,
      manifestedCount,
      totalShipments: shipments.length,
    };
  }

  async getShipmentById(id) {
    const shipment = await Shipment.findById(id);
    if (!shipment) throw new Error(`Shipment record "${id}" not found.`);
    return shipment;
  }

  async updateShipmentStatus(id, shipping_status, notes = '', adminUser = null, ip = null) {
    const shipment = await this.getShipmentById(id);
    const updated = await Shipment.updateStatus(id, shipping_status, notes);

    // Sync order status
    const order = db.orders.find((o) => o.id === shipment.order_id || o.order_number === shipment.order_number);
    if (order) {
      if (shipping_status === 'DELIVERED') {
        order.order_status = 'DELIVERED';
        order.status = 'DELIVERED';
      } else if (shipping_status === 'IN_TRANSIT' || shipping_status === 'OUT_FOR_DELIVERY') {
        order.order_status = 'DISPATCHED';
        order.status = 'SHIPPED';
      }
    }

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_SHIPMENT_STATUS',
        module: 'OPERATIONS',
        details: `Updated shipment AWB ${shipment.tracking_number} status to "${shipping_status}"`,
        ip_address: ip,
      });
    }

    return updated;
  }
}

module.exports = new ShipmentService();
