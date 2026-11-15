const { db, saveDatabase } = require('../config/db');

if (!db.reviews) db.reviews = [];

class Review {
  static async find(filter = {}) {
    let results = [...(db.reviews || [])];
    if (filter.status) {
      results = results.filter((r) => r.status === filter.status);
    }
    if (filter.product_id) {
      results = results.filter((r) => String(r.product_id) === String(filter.product_id));
    }
    if (filter.user_id) {
      results = results.filter((r) => String(r.user_id) === String(filter.user_id));
    }
    if (filter.rating) {
      results = results.filter((r) => Number(r.rating) === parseInt(filter.rating, 10));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (r) =>
          (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
          (r.product_name && r.product_name.toLowerCase().includes(q)) ||
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.comment && r.comment.toLowerCase().includes(q))
      );
    }
    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async findById(id) {
    return (db.reviews || []).find((r) => String(r.id) === String(id)) || null;
  }

  static async findByUserId(user_id) {
    return (db.reviews || []).filter((r) => String(r.user_id) === String(user_id));
  }

  static async findByProductId(product_id) {
    return (db.reviews || []).filter((r) => String(r.product_id) === String(product_id));
  }

  static async create(reviewData) {
    if (!db.reviews) db.reviews = [];
    const nextId = reviewData.id || `rev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newReview = {
      id: nextId,
      user_id: reviewData.user_id,
      customer_name: reviewData.customer_name || 'Sneaker Squad Member',
      product_id: reviewData.product_id,
      product_name: reviewData.product_name || 'Neleeri Sneaker Drop',
      order_item_id: reviewData.order_item_id || null,
      rating: Number(reviewData.rating) || 5,
      title: reviewData.title || 'Verified Drop Review',
      comment: reviewData.comment || '',
      status: reviewData.status || 'APPROVED',
      created_at: new Date().toISOString(),
    };
    db.reviews.push(newReview);
    if (typeof saveDatabase === 'function') saveDatabase();
    return newReview;
  }

  static async updateStatus(id, status) {
    const review = (db.reviews || []).find((r) => String(r.id) === String(id));
    if (!review) return null;
    review.status = status;
    if (typeof saveDatabase === 'function') saveDatabase();
    return review;
  }

  static async delete(id) {
    const index = (db.reviews || []).findIndex((r) => String(r.id) === String(id));
    if (index === -1) return false;
    db.reviews.splice(index, 1);
    if (typeof saveDatabase === 'function') saveDatabase();
    return true;
  }
}

module.exports = Review;