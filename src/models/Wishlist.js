const { db } = require('../config/db');

if (!db.wishlists) db.wishlists = [];
if (!db.wishlist_items) db.wishlist_items = [];

class Wishlist {
  static async getWishlistByUserId(user_id) {
    let wishlist = db.wishlists.find((w) => String(w.user_id) === String(user_id));
    if (!wishlist) {
      const nextId = db.wishlists.length > 0 ? Math.max(...db.wishlists.map((w) => Number(w.id) || 0)) + 1 : 1;
      wishlist = {
        id: nextId,
        user_id,
        created_at: new Date().toISOString(),
      };
      db.wishlists.push(wishlist);
    }
    return wishlist;
  }

  static async getItemsWithProducts(user_id) {
    const wishlist = await this.getWishlistByUserId(user_id);
    const items = db.wishlist_items.filter((item) => String(item.wishlist_id) === String(wishlist.id));

    // Join with products table
    return items.map((item) => {
      const product = (db.products || []).find((p) => String(p.id) === String(item.product_id)) || {};
      return {
        id: item.id,
        wishlist_id: item.wishlist_id,
        product_id: item.product_id,
        added_at: item.added_at,
        name: product.name || 'Neleeri Sneaker',
        price: product.price || 149.99,
        image: product.image || item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
        brand: product.brand || 'Neleeri Lab',
      };
    });
  }

  static async addItem(user_id, product_id) {
    const wishlist = await this.getWishlistByUserId(user_id);
    const existing = db.wishlist_items.find(
      (item) => String(item.wishlist_id) === String(wishlist.id) && String(item.product_id) === String(product_id)
    );
    if (existing) return existing;

    const nextId = db.wishlist_items.length > 0 ? Math.max(...db.wishlist_items.map((i) => Number(i.id) || 0)) + 1 : 1;
    const newItem = {
      id: nextId,
      wishlist_id: wishlist.id,
      product_id,
      added_at: new Date().toISOString(),
    };
    db.wishlist_items.push(newItem);
    return newItem;
  }

  static async removeItem(user_id, product_id) {
    const wishlist = await this.getWishlistByUserId(user_id);
    const index = db.wishlist_items.findIndex(
      (item) => String(item.wishlist_id) === String(wishlist.id) && String(item.product_id) === String(product_id)
    );
    if (index === -1) return false;
    db.wishlist_items.splice(index, 1);
    return true;
  }
}

module.exports = Wishlist;
