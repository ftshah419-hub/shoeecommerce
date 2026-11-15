const { db } = require('../config/db');

if (!db.reviews) db.reviews = [];

class Review {
  static async findByUserId(user_id) {
    return (db.reviews || []).filter((r) => String(r.user_id) === String(user_id));
  }

  static async findByProductId(product_id) {
    return (db.reviews || []).filter((r) => String(r.product_id) === String(product_id));
  }

  static async create(reviewData) {
    if (!db.reviews) db.reviews = [];
    const nextId = db.reviews.length > 0 ? Math.max(...db.reviews.map((r) => Number(r.id) || 0)) + 1 : 1;
    const newReview = {
      id: nextId,
      user_id: reviewData.user_id,
      product_id: reviewData.product_id,
      order_item_id: reviewData.order_item_id || null,
      rating: Number(reviewData.rating) || 5,
      comment: reviewData.comment || '',
      status: reviewData.status || 'APPROVED',
      created_at: new Date().toISOString(),
    };
    db.reviews.push(newReview);
    return newReview;
  }
}

module.exports = Review;
