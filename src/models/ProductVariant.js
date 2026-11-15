const { db, saveDatabase } = require('../config/db');

class ProductVariant {
  static async find(filter = {}) {
    let results = [...db.product_variants];
    if (filter.product_id) {
      results = results.filter((v) => v.product_id === filter.product_id);
    }
    if (filter.sku) {
      results = results.filter((v) => v.sku.toLowerCase() === filter.sku.toLowerCase());
    }
    if (filter.is_active !== undefined) {
      results = results.filter((v) => Boolean(v.is_active) === Boolean(filter.is_active));
    }
    return results;
  }

  static async findById(id) {
    return db.product_variants.find((v) => v.id === id) || null;
  }

  static async create(variantData) {
    const id = `var_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newVariant = {
      id,
      product_id: variantData.product_id,
      sku: variantData.sku || `SKU-${Date.now().toString().slice(-6)}`,
      size: variantData.size || 'UK 9.0',
      color: variantData.color || 'Standard',
      color_code: variantData.color_code || '#121316',
      additional_price: parseFloat(variantData.additional_price) || 0,
      stock_quantity: parseInt(variantData.stock_quantity, 10) || 0,
      low_stock_threshold: parseInt(variantData.low_stock_threshold, 10) || 5,
      is_active: variantData.is_active !== undefined ? Boolean(variantData.is_active) : true,
      created_at: new Date().toISOString(),
    };
    db.product_variants.push(newVariant);
    saveDatabase();
    return newVariant;
  }

  static async update(id, updateData) {
    const index = db.product_variants.findIndex((v) => v.id === id);
    if (index === -1) return null;
    db.product_variants[index] = { ...db.product_variants[index], ...updateData };
    saveDatabase();
    return db.product_variants[index];
  }

  static async delete(id) {
    const index = db.product_variants.findIndex((v) => v.id === id);
    if (index === -1) return false;
    db.product_variants.splice(index, 1);
    saveDatabase();
    return true;
  }
}

module.exports = ProductVariant;
