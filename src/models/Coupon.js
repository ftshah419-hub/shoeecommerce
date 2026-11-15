const { db, saveDatabase } = require('../config/db');

class Coupon {
  static async find(filter = {}) {
    let results = [...(db.coupons || [])];
    if (filter.is_active !== undefined) {
      results = results.filter((c) => Boolean(c.is_active) === Boolean(filter.is_active));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter((c) => c.code.toLowerCase().includes(q));
    }
    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async findById(id) {
    return db.coupons.find((c) => c.id === id || c.code.toUpperCase() === id.toUpperCase()) || null;
  }

  static async create(couponData) {
    const id = `coup_${Date.now()}`;
    const newCoupon = {
      id,
      code: couponData.code.trim().toUpperCase(),
      discount_type: couponData.discount_type || 'PERCENTAGE',
      discount_value: parseFloat(couponData.discount_value) || 0,
      min_order_amount: parseFloat(couponData.min_order_amount) || 0,
      max_discount_amount: parseFloat(couponData.max_discount_amount) || 0,
      usage_limit: parseInt(couponData.usage_limit, 10) || 100,
      times_used: 0,
      start_date: couponData.start_date || new Date().toISOString().split('T')[0],
      expiry_date: couponData.expiry_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      is_active: couponData.is_active !== undefined ? Boolean(couponData.is_active) : true,
      created_at: new Date().toISOString(),
    };
    db.coupons.push(newCoupon);
    saveDatabase();
    return newCoupon;
  }

  static async update(id, updateData) {
    const index = db.coupons.findIndex((c) => c.id === id);
    if (index === -1) return null;
    db.coupons[index] = { ...db.coupons[index], ...updateData };
    saveDatabase();
    return db.coupons[index];
  }

  static async delete(id) {
    const index = db.coupons.findIndex((c) => c.id === id);
    if (index === -1) return false;
    db.coupons.splice(index, 1);
    saveDatabase();
    return true;
  }
}

module.exports = Coupon;
