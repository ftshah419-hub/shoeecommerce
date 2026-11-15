const { db, saveDatabase } = require('../config/db');

class InventoryLog {
  static async find(filter = {}) {
    let results = [...(db.inventory_logs || [])];

    if (filter.variant_id) {
      results = results.filter((l) => l.variant_id === filter.variant_id);
    }
    if (filter.change_type) {
      results = results.filter((l) => l.change_type === filter.change_type);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (l) =>
          (l.product_name && l.product_name.toLowerCase().includes(q)) ||
          (l.sku && l.sku.toLowerCase().includes(q)) ||
          (l.notes && l.notes.toLowerCase().includes(q)) ||
          (l.admin_name && l.admin_name.toLowerCase().includes(q))
      );
    }

    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async create(logData) {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newLog = {
      id,
      variant_id: logData.variant_id,
      product_name: logData.product_name || 'Sneaker Variant',
      sku: logData.sku || '',
      change_type: logData.change_type || 'MANUAL_ADJUSTMENT',
      quantity_change: parseInt(logData.quantity_change, 10) || 0,
      previous_quantity: parseInt(logData.previous_quantity, 10) || 0,
      new_quantity: parseInt(logData.new_quantity, 10) || 0,
      reference_id: logData.reference_id || `ADJ-${Date.now().toString().slice(-6)}`,
      reference_type: logData.reference_type || 'ADMIN_ADJUSTMENT',
      notes: logData.notes || '',
      admin_id: logData.admin_id || 'SYSTEM',
      admin_name: logData.admin_name || 'Admin Operations',
      created_at: new Date().toISOString(),
    };
    db.inventory_logs.push(newLog);
    saveDatabase();
    return newLog;
  }
}

module.exports = InventoryLog;
