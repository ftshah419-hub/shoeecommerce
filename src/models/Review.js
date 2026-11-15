const { db, saveDatabase } = require('../config/db');

class Review {
  static async find(filter = {}) {
    let results = [...(db.reviews || [])];
    if (filter.status) {
      results = results.filter((r) => r.status === filter.status);
    }
    if (filter.product_id) {
      results = results.filter((r) => r.product_id === filter.product_id);
    }
    if (filter.rating) {
      results = results.filter((r) => r.rating === parseInt(filter.rating, 10));
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
    return db.reviews.find((r) => r.id === id) || null;
  }

  static async updateStatus(id, status) {
    const review = db.reviews.find((r) => r.id === id);
    if (!review) return null;
    review.status = status;
    saveDatabase();
    return review;
  }

  static async delete(id) {
    const index = db.reviews.findIndex((r) => r.id === id);
    if (index === -1) return false;
    db.reviews.splice(index, 1);
    saveDatabase();
    return true;
  }
}

module.exports = Review;
