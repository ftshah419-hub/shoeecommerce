const { db, saveDatabase } = require('../config/db');

class Product {
  static async find(filter = {}) {
    let results = [...db.products];

    if (filter.category) {
      results = results.filter(
        (p) =>
          p.category &&
          (p.category.toLowerCase() === filter.category.toLowerCase() ||
            p.category_id === filter.category)
      );
    }

    if (filter.category_id) {
      results = results.filter((p) => p.category_id === filter.category_id);
    }

    if (filter.brand) {
      results = results.filter((p) => p.brand && p.brand.toLowerCase() === filter.brand.toLowerCase());
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.model_code && p.model_code.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    if (filter.featured !== undefined) {
      results = results.filter((p) => Boolean(p.is_featured || p.featured) === Boolean(filter.featured));
    }

    if (filter.is_active !== undefined) {
      results = results.filter((p) => Boolean(p.is_active) === Boolean(filter.is_active));
    }

    if (filter.stock_status) {
      if (filter.stock_status === 'out_of_stock') {
        results = results.filter((p) => (p.stock || 0) <= 0);
      } else if (filter.stock_status === 'low_stock') {
        results = results.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 15);
      } else if (filter.stock_status === 'in_stock') {
        results = results.filter((p) => (p.stock || 0) > 15);
      }
    }

    // Sort order
    if (filter.sort === 'price_asc') {
      results.sort((a, b) => (a.price || a.sale_price) - (b.price || b.sale_price));
    } else if (filter.sort === 'price_desc') {
      results.sort((a, b) => (b.price || b.sale_price) - (a.price || a.sale_price));
    } else if (filter.sort === 'stock_asc') {
      results.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    } else {
      results.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
    }

    return results.map((p) => this._formatProduct(p));
  }

  static async findById(id) {
    const product = db.products.find((p) => p.id === id);
    if (!product) return null;
    return this._formatProduct(product);
  }

  static _formatProduct(p) {
    const variants = (db.product_variants || []).filter((v) => v.product_id === p.id);
    const images = (db.product_images || []).filter((img) => img.product_id === p.id);
    const calculatedStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
      : (p.stock || 0);

    return {
      ...p,
      stock: calculatedStock,
      price: p.sale_price || p.base_price || p.price || 0,
      variants,
      images,
      image: p.image || (images[0] ? images[0].image_url : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'),
    };
  }

  static async create(productData) {
    const id = `snk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const category = db.categories.find((c) => c.id === productData.category_id);

    const newProduct = {
      id,
      category_id: productData.category_id || (category ? category.id : 'cat_001'),
      category: category ? category.name : (productData.category || 'Streetwear'),
      name: productData.name.trim(),
      slug: (productData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      model_code: productData.model_code || `NL-${Math.floor(100 + Math.random() * 900)}`,
      brand: productData.brand || 'Neleeri Lab',
      base_price: parseFloat(productData.base_price || productData.price) || 0,
      sale_price: parseFloat(productData.sale_price || productData.price) || 0,
      price: parseFloat(productData.sale_price || productData.price) || 0,
      stock: parseInt(productData.stock, 10) || 0,
      sizes: Array.isArray(productData.sizes) ? productData.sizes : [7.5, 8.5, 9.5, 10.5],
      description: productData.description || '',
      image: productData.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      is_featured: Boolean(productData.is_featured || productData.featured),
      featured: Boolean(productData.is_featured || productData.featured),
      is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.products.push(newProduct);

    // Create primary image entry
    if (newProduct.image) {
      db.product_images.push({
        id: `img_${Date.now()}`,
        product_id: id,
        variant_id: null,
        image_url: newProduct.image,
        is_primary: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
      });
    }

    // Automatically create size variants
    const sizes = newProduct.sizes;
    sizes.forEach((sz, idx) => {
      db.product_variants.push({
        id: `var_${Date.now()}_${idx}`,
        product_id: id,
        sku: `${newProduct.model_code}-${String(sz).replace('.', '')}`,
        size: `UK ${sz}`,
        color: productData.color || 'Obsidian Black',
        color_code: productData.color_code || '#121316',
        additional_price: 0,
        stock_quantity: Math.max(1, Math.floor(newProduct.stock / sizes.length)),
        low_stock_threshold: 5,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    });

    saveDatabase();
    return this.findById(id);
  }

  static async update(id, updateData) {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    if (updateData.category_id) {
      const cat = db.categories.find((c) => c.id === updateData.category_id);
      if (cat) updateData.category = cat.name;
    }

    if (updateData.price && !updateData.sale_price) {
      updateData.sale_price = parseFloat(updateData.price);
    }

    db.products[index] = {
      ...db.products[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    saveDatabase();
    return this.findById(id);
  }

  static async delete(id) {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    db.products.splice(index, 1);
    
    // Also remove associated variants & images
    db.product_variants = db.product_variants.filter((v) => v.product_id !== id);
    db.product_images = db.product_images.filter((img) => img.product_id !== id);
    
    saveDatabase();
    return true;
  }
}

module.exports = Product;
