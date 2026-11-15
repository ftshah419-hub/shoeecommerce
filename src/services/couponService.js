const Coupon = require('../models/Coupon');
const AdminActivityLog = require('../models/AdminActivityLog');
const { db } = require('../config/db');

class CouponService {
  async getAllCoupons(query = {}) {
    const coupons = await Coupon.find(query);
    const usages = db.coupon_usages || [];
    return coupons.map((c) => ({
      ...c,
      usageCount: (usages.filter((u) => u.coupon_id === c.id)).length || c.times_used,
    }));
  }

  async createCoupon(data, adminUser = null, ip = null) {
    if (!data.code || !data.discount_value) {
      throw new Error('Coupon code and discount value are required.');
    }

    const created = await Coupon.create(data);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'CREATE_COUPON',
        module: 'MARKETING',
        details: `Created promo code "${created.code}" (${created.discount_value}${created.discount_type === 'PERCENTAGE' ? '%' : ' INR'})`,
        ip_address: ip,
      });
    }

    return created;
  }

  async updateCoupon(id, data, adminUser = null, ip = null) {
    const updated = await Coupon.update(id, data);
    if (adminUser && updated) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_COUPON',
        module: 'MARKETING',
        details: `Updated coupon parameters for "${updated.code}"`,
        ip_address: ip,
      });
    }
    return updated;
  }

  async toggleCoupon(id, adminUser = null, ip = null) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error('Coupon not found.');

    const is_active = !coupon.is_active;
    const updated = await Coupon.update(id, { is_active });

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'TOGGLE_COUPON',
        module: 'MARKETING',
        details: `${is_active ? 'Activated' : 'Deactivated'} promo coupon "${coupon.code}"`,
        ip_address: ip,
      });
    }

    return updated;
  }

  async deleteCoupon(id, adminUser = null, ip = null) {
    const coupon = await Coupon.findById(id);
    const deleted = await Coupon.delete(id);

    if (adminUser && coupon) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'DELETE_COUPON',
        module: 'MARKETING',
        details: `Deleted coupon code "${coupon.code}"`,
        ip_address: ip,
      });
    }

    return deleted;
  }
}

module.exports = new CouponService();
