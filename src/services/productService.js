const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductVariant = require('../models/ProductVariant');
const AdminActivityLog = require('../models/AdminActivityLog');

class ProductService {
  async getAllProducts(query = {}) {
    return Product.find(query);
  }

  async getFeaturedProducts() {
    return Product.find({ featured: true });
  }

  async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error(`Sneaker with ID "${id}" was not found.`);
    }
    return product;
  }

  async createProduct(data, adminUser = null, ip = null) {
    const { name, brand, category_id, base_price, sale_price, price, sizes, stock, description, image, model_code, color } = data;

    if (!name || (!base_price && !price)) {
      throw new Error('Product name and price are required.');
    }

    const created = await Product.create({
      name: name.trim(),
      brand: (brand || 'Neleeri Lab').trim(),
      category_id: category_id || 'cat_001',
      model_code: model_code ? model_code.trim() : undefined,
      base_price: parseFloat(base_price || price) || 0,
      sale_price: parseFloat(sale_price || price || base_price) || 0,
      price: parseFloat(sale_price || price || base_price) || 0,
      stock: parseInt(stock, 10) || 0,
      sizes: sizes,
      color: color || 'Obsidian Black',
      description: (description || '').trim(),
      image: image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      is_featured: Boolean(data.featured || data.is_featured),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    });

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'CREATE_PRODUCT',
        module: 'PRODUCTS',
        details: `Created new sneaker silhouette "${created.name}" (SKU: ${created.model_code})`,
        ip_address: ip,
      });
    }

    return created;
  }

  async updateProduct(id, data, adminUser = null, ip = null) {
    await this.getProductById(id); // Ensure exists

    const updated = await Product.update(id, data);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_PRODUCT',
        module: 'PRODUCTS',
        details: `Updated sneaker "${updated.name}" specifications`,
        ip_address: ip,
      });
    }

    return updated;
  }

  async deleteProduct(id, adminUser = null, ip = null) {
    const product = await this.getProductById(id);
    const deleted = await Product.delete(id);

    if (adminUser && deleted) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'DELETE_PRODUCT',
        module: 'PRODUCTS',
        details: `Decommissioned sneaker "${product.name}" from catalog`,
        ip_address: ip,
      });
    }

    return deleted;
  }

  // Categories
  async getAllCategories() {
    return Category.find();
  }

  async createCategory(data, adminUser = null, ip = null) {
    if (!data.name) throw new Error('Category name is required.');
    const cat = await Category.create(data);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'CREATE_CATEGORY',
        module: 'PRODUCTS',
        details: `Created new product category "${cat.name}"`,
        ip_address: ip,
      });
    }
    return cat;
  }

  async updateCategory(id, data, adminUser = null, ip = null) {
    const updated = await Category.update(id, data);
    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_CATEGORY',
        module: 'PRODUCTS',
        details: `Updated category "${updated.name}"`,
        ip_address: ip,
      });
    }
    return updated;
  }

  async deleteCategory(id, adminUser = null, ip = null) {
    const cat = await Category.findById(id);
    const deleted = await Category.delete(id);
    if (adminUser && cat) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'DELETE_CATEGORY',
        module: 'PRODUCTS',
        details: `Deleted category "${cat.name}"`,
        ip_address: ip,
      });
    }
    return deleted;
  }

  // Sneaker Product Variants
  async getAllVariants(query = {}) {
    const variants = await ProductVariant.find(query);
    const products = await Product.find();
    return variants.map((v) => {
      const parentProduct = products.find((p) => p.id === v.product_id);
      return {
        ...v,
        product_name: parentProduct ? parentProduct.name : 'Unknown Silhouette',
        product_image: parentProduct ? parentProduct.image : null,
        product_brand: parentProduct ? parentProduct.brand : 'Neleeri Lab',
        base_price: parentProduct ? (parentProduct.sale_price || parentProduct.price) : 0,
        effective_price: (parentProduct ? (parentProduct.sale_price || parentProduct.price) : 0) + (v.additional_price || 0),
      };
    });
  }

  async getVariantById(id) {
    const variant = await ProductVariant.findById(id);
    if (!variant) throw new Error(`Product variant with ID "${id}" was not found.`);
    return variant;
  }

  async createVariant(data, adminUser = null, ip = null) {
    if (!data.product_id) throw new Error('Product silhouette is required.');
    if (!data.size) throw new Error('Shoe size is required.');
    
    const variant = await ProductVariant.create({
      product_id: data.product_id,
      sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
      size: data.size,
      color: data.color || 'Standard',
      color_code: data.color_code || '#0f172a',
      additional_price: parseFloat(data.additional_price) || 0,
      stock_quantity: parseInt(data.stock_quantity, 10) || 0,
      low_stock_threshold: parseInt(data.low_stock_threshold, 10) || 5,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    });

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'CREATE_VARIANT',
        module: 'PRODUCTS',
        details: `Created new size variant "${variant.size} - ${variant.color}" (SKU: ${variant.sku})`,
        ip_address: ip,
      });
    }
    return variant;
  }

  async updateVariant(id, data, adminUser = null, ip = null) {
    const variant = await this.getVariantById(id);
    const updated = await ProductVariant.update(id, data);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_VARIANT',
        module: 'PRODUCTS',
        details: `Updated variant SKU "${updated.sku}" (${updated.size} / ${updated.color})`,
        ip_address: ip,
      });
    }
    return updated;
  }

  async deleteVariant(id, adminUser = null, ip = null) {
    const variant = await this.getVariantById(id);
    const deleted = await ProductVariant.delete(id);

    if (adminUser && deleted) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'DELETE_VARIANT',
        module: 'PRODUCTS',
        details: `Deleted variant SKU "${variant.sku}"`,
        ip_address: ip,
      });
    }
    return deleted;
  }
}

module.exports = new ProductService();
