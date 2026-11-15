const { db } = require('../config/db');

class Product {
  static async find(filter = {}) {
    let results = [...db.products];

    if (filter.category) {
      results = results.filter((p) => p.category.toLowerCase() === filter.category.toLowerCase());
    }

    if (filter.brand) {
      results = results.filter((p) => p.brand.toLowerCase() === filter.brand.toLowerCase());
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    if (filter.featured !== undefined) {
      results = results.filter((p) => Boolean(p.featured) === Boolean(filter.featured));
    }

    return results;
  }

  static async findById(id) {
    return db.products.find((p) => p.id === id) || null;
  }

  static async create(productData) {
    const newProduct = {
      id: `snk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      ...productData,
    };
    db.products.push(newProduct);
    return newProduct;
  }

  static async update(id, updateData) {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    db.products[index] = { ...db.products[index], ...updateData, updatedAt: new Date().toISOString() };
    return db.products[index];
  }

  static async delete(id) {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    db.products.splice(index, 1);
    return true;
  }
}

module.exports = Product;
