const Review = require('../models/Review');
const AdminActivityLog = require('../models/AdminActivityLog');

class ReviewService {
  async getAllReviews(query = {}) {
    return Review.find(query);
  }

  async updateReviewStatus(id, status, adminUser = null, ip = null) {
    const valid = ['APPROVED', 'PENDING', 'REJECTED'];
    if (!valid.includes(status)) {
      throw new Error(`Invalid status "${status}". Allowed: ${valid.join(', ')}`);
    }

    const review = await Review.findById(id);
    if (!review) throw new Error('Review record not found.');

    const updated = await Review.updateStatus(id, status);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'MODERATE_REVIEW',
        module: 'CUSTOMER_SQUAD',
        details: `Set review for "${review.product_name}" by "${review.customer_name}" to "${status}"`,
        ip_address: ip,
      });
    }

    return updated;
  }

  async deleteReview(id, adminUser = null, ip = null) {
    const review = await Review.findById(id);
    const deleted = await Review.delete(id);

    if (adminUser && review) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'DELETE_REVIEW',
        module: 'CUSTOMER_SQUAD',
        details: `Deleted review #${id} on "${review.product_name}"`,
        ip_address: ip,
      });
    }

    return deleted;
  }
}

module.exports = new ReviewService();
