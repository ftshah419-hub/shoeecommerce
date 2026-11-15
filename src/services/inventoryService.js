const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const InventoryLog = require('../models/InventoryLog');
const AdminActivityLog = require('../models/AdminActivityLog');
const { db, saveDatabase } = require('../config/db');

class InventoryService {
  async getInventoryOverview(query = {}) {
    const products = await Product.find(query);
    const variants = await ProductVariant.find();
    const logs = await InventoryLog.find(query);

    const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockThreshold = 15;
    const lowStockItems = products.filter((p) => (p.stock || 0) <= lowStockThreshold && (p.stock || 0) > 0);
    const outOfStockItems = products.filter((p) => (p.stock || 0) <= 0);

    return {
      products,
      variants,
      logs,
      totalStockUnits,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      outOfStockItems,
    };
  }

  async adjustStock({ variant_id, product_id, quantity_change, change_type, notes, adminUser, ip }) {
    let variant = null;
    let product = null;

    if (variant_id) {
      variant = await ProductVariant.findById(variant_id);
      if (variant) {
        product = await Product.findById(variant.product_id);
      }
    } else if (product_id) {
      product = await Product.findById(product_id);
      const variants = await ProductVariant.find({ product_id });
      if (variants.length > 0) variant = variants[0];
    }

    if (!product) {
      throw new Error('Target product or variant not found for stock adjustment.');
    }

    const qty = parseInt(quantity_change, 10);
    if (isNaN(qty) || qty === 0) {
      throw new Error('Quantity change must be a valid non-zero integer.');
    }

    const previous_quantity = variant ? (variant.stock_quantity || 0) : (product.stock || 0);
    const new_quantity = Math.max(0, previous_quantity + qty);

    if (variant) {
      await ProductVariant.update(variant.id, { stock_quantity: new_quantity });
    }

    // Update parent product stock
    const allVariants = await ProductVariant.find({ product_id: product.id });
    const totalVariantStock = allVariants.length > 0
      ? allVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
      : new_quantity;

    await Product.update(product.id, { stock: totalVariantStock });

    // Record in inventory_logs
    const log = await InventoryLog.create({
      variant_id: variant ? variant.id : 'N/A',
      product_name: `${product.name} ${variant ? `(${variant.size})` : ''}`,
      sku: variant ? variant.sku : product.model_code,
      change_type: change_type || 'MANUAL_ADJUSTMENT',
      quantity_change: qty,
      previous_quantity,
      new_quantity,
      reference_id: `ADJ-${Date.now().toString().slice(-6)}`,
      reference_type: 'ADMIN_ADJUSTMENT',
      notes: notes || 'Manual warehouse stock calibration',
      admin_id: adminUser ? adminUser.id : 'ADMIN',
      admin_name: adminUser ? adminUser.name : 'Vikram Singhania',
    });

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'ADJUST_STOCK',
        module: 'INVENTORY',
        details: `Adjusted inventory for "${product.name}": ${qty > 0 ? '+' : ''}${qty} units (New total: ${new_quantity})`,
        ip_address: ip,
      });
    }

    return { product, variant, log };
  }

  async getInventoryLogs(query = {}) {
    return InventoryLog.find(query);
  }
}

module.exports = new InventoryService();
