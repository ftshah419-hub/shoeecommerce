const { db, saveDatabase } = require('../config/db');

class Order {
  static async find(filter = {}) {
    let results = [...db.orders];

    if (filter.userId) {
      results = results.filter((o) => o.user_id === filter.userId || o.userId === filter.userId);
    }

    if (filter.status && filter.status !== 'ALL') {
      const target = filter.status.toUpperCase();
      results = results.filter(
        (o) =>
          (o.order_status && o.order_status.toUpperCase() === target) ||
          (o.status && o.status.toUpperCase() === target)
      );
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (o) =>
          (o.order_number && o.order_number.toLowerCase().includes(q)) ||
          (o.id && o.id.toLowerCase().includes(q)) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.userName && o.userName.toLowerCase().includes(q)) ||
          (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
          (o.userEmail && o.userEmail.toLowerCase().includes(q)) ||
          (o.tracking_number && o.tracking_number.toLowerCase().includes(q)) ||
          (o.courier_name && o.courier_name.toLowerCase().includes(q))
      );
    }

    if (filter.gateway && filter.gateway !== 'All Gateways') {
      results = results.filter((o) => o.gateway && o.gateway.includes(filter.gateway));
    }

    if (filter.courier && filter.courier !== 'All Logistics') {
      results = results.filter((o) => o.courier_name && o.courier_name.toLowerCase().includes(filter.courier.toLowerCase()));
    }

    return results
      .map((o) => this._formatOrder(o))
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
  }

  static async findById(id) {
    const order = db.orders.find((o) => o.id === id || o.order_number === id);
    if (!order) return null;
    return this._formatOrder(order);
  }

  static _formatOrder(o) {
    const items = (db.order_items || []).filter((it) => it.order_id === o.id);
    const payment = (db.payments || []).find((p) => p.order_id === o.id || p.order_number === o.order_number);
    const shipment = (db.shipments || []).find((s) => s.order_id === o.id || s.order_number === o.order_number);

    return {
      ...o,
      items: items.length > 0 ? items : (o.items || []),
      payment: payment || null,
      shipment: shipment || null,
      totalAmount: o.final_amount || o.total_amount || o.totalAmount || 0,
      customer_name: o.customer_name || o.userName || 'Valued Sneakerhead',
      customer_email: o.customer_email || o.userEmail || '',
      order_number: o.order_number || `#NL-${o.id ? o.id.replace(/\D/g, '').slice(-5) : '88294'}`,
    };
  }

  static async create(orderData) {
    const id = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const order_number = `NL-${Math.floor(80000 + Math.random() * 19999)}`;

    const newOrder = {
      id,
      order_number,
      user_id: orderData.userId || orderData.user_id,
      customer_name: orderData.userName || orderData.customer_name || 'Sneaker Squad Member',
      customer_email: orderData.userEmail || orderData.customer_email || '',
      customer_phone: orderData.customer_phone || '+91 98200 00000',
      squad_tier: orderData.squad_tier || 'Lvl 1 Initiate',
      squad_uid: `SQ-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      drop_tag: 'DROP-04 // HYPER',
      total_amount: orderData.totalAmount || orderData.total_amount || 0,
      discount_amount: orderData.discount_amount || 0,
      shipping_charge: orderData.shipping_charge || 0,
      tax_amount: Math.round(((orderData.totalAmount || orderData.total_amount || 0) * 0.18) * 100) / 100,
      final_amount: orderData.totalAmount || orderData.total_amount || 0,
      order_status: orderData.status || 'PROCESSING',
      status: orderData.status || 'PROCESSING',
      payment_status: orderData.payment_status || 'PAID',
      shipping_address: typeof orderData.shippingAddress === 'object'
        ? `${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}`
        : (orderData.shippingAddress || 'Studio 402, Skyline Heights, Mumbai 400050'),
      destination_pincode: (orderData.shippingAddress && orderData.shippingAddress.zipCode) || '400050',
      courier_name: 'Bluedart Priority Aviation',
      tracking_number: `BLD-EXP-${Math.floor(100 + Math.random() * 900)}`,
      nfc_token: `NK-${order_number.replace(/\D/g, '')}-NFC`,
      tamper_seal: 'ACTIVE',
      priority: 'HIGH',
      gateway: 'UPI Instant (GPay)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.orders.push(newOrder);

    // Save itemized records
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items.forEach((item, idx) => {
        db.order_items.push({
          id: `item_${Date.now()}_${idx}`,
          order_id: id,
          product_id: item.productId,
          variant_id: item.variantId || null,
          product_name: item.name,
          product_image: item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
          sku: item.sku || `NL-SKU-${Math.floor(100 + Math.random() * 900)}`,
          size: typeof item.size === 'number' ? `UK ${item.size}` : item.size,
          color: item.color || 'Obsidian Black',
          unit_price: item.price,
          quantity: item.quantity,
          subtotal_price: item.price * item.quantity,
          created_at: new Date().toISOString(),
        });
      });
    }

    // Save Payment record
    db.payments.push({
      id: `pay_${Date.now()}`,
      order_id: id,
      order_number,
      customer_name: newOrder.customer_name,
      payment_method: 'UPI',
      payment_gateway: 'Razorpay Instant UPI',
      transaction_id: `UPI/${Date.now().toString().slice(-9)}/OKICICI`,
      amount: newOrder.final_amount,
      currency: 'INR',
      status: 'SUCCESS',
      fraud_score: '0.02% (PASS)',
      settlement_time: 'Instant MPIN Verified',
      created_at: new Date().toISOString(),
    });

    // Save Shipment record
    db.shipments.push({
      id: `ship_${Date.now()}`,
      order_id: id,
      order_number,
      customer_name: newOrder.customer_name,
      courier_name: 'Bluedart Priority Aviation',
      tracking_number: newOrder.tracking_number,
      shipping_status: 'MANIFESTED',
      origin_hub: 'BOM-HUB-01 (Mumbai Warehouse, Kurla)',
      destination_hub: 'BOM-HUB-02 (Local Sort Facility)',
      destination_city: 'Mumbai',
      flight_number: 'BD-662',
      dispatched_at: new Date().toISOString(),
      estimated_delivery: new Date(Date.now() + 24 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
    });

    saveDatabase();
    return this.findById(id);
  }

  static async updateStatus(id, status, notes = '') {
    const order = db.orders.find((o) => o.id === id || o.order_number === id);
    if (!order) return null;

    order.order_status = status;
    order.status = status;
    order.updated_at = new Date().toISOString();

    // Sync with shipments
    const shipment = db.shipments.find((s) => s.order_id === order.id);
    if (shipment) {
      if (status === 'SHIPPED' || status === 'DISPATCHED') {
        shipment.shipping_status = 'IN_TRANSIT';
      } else if (status === 'DELIVERED') {
        shipment.shipping_status = 'DELIVERED';
        shipment.delivered_at = new Date().toISOString();
      } else if (status === 'CANCELLED') {
        shipment.shipping_status = 'FAILED';
      }
    }

    saveDatabase();
    return this.findById(order.id);
  }

  static async bulkDispatch(orderIds, courierName = 'Bluedart Priority Aviation') {
    const updated = [];
    for (const id of orderIds) {
      const order = db.orders.find((o) => o.id === id || o.order_number === id);
      if (order) {
        order.order_status = 'DISPATCHED';
        order.status = 'SHIPPED';
        order.courier_name = courierName;
        if (!order.tracking_number || order.tracking_number === 'AWB-PENDING') {
          order.tracking_number = `BLD-EXP-${Math.floor(100 + Math.random() * 900)}`;
        }
        order.updated_at = new Date().toISOString();

        let shipment = db.shipments.find((s) => s.order_id === order.id);
        if (shipment) {
          shipment.shipping_status = 'IN_TRANSIT';
          shipment.courier_name = courierName;
          shipment.tracking_number = order.tracking_number;
          shipment.dispatched_at = new Date().toISOString();
        } else {
          db.shipments.push({
            id: `ship_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            order_id: order.id,
            order_number: order.order_number,
            customer_name: order.customer_name,
            courier_name: courierName,
            tracking_number: order.tracking_number,
            shipping_status: 'IN_TRANSIT',
            origin_hub: 'BOM-HUB-01 (Mumbai Warehouse, Kurla)',
            destination_hub: 'AIR-FREIGHT-SORT',
            destination_city: 'Mumbai',
            flight_number: 'BD-662',
            dispatched_at: new Date().toISOString(),
            estimated_delivery: new Date(Date.now() + 24 * 3600000).toISOString(),
            created_at: new Date().toISOString(),
          });
        }
        updated.push(order);
      }
    }
    saveDatabase();
    return updated;
  }
}

module.exports = Order;
