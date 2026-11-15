const { db, saveDatabase } = require('../config/db');

class Category {
  static async find(filter = {}) {
    let results = [...db.categories];
    if (filter.is_active !== undefined) {
      results = results.filter((c) => Boolean(c.is_active) === Boolean(filter.is_active));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return results;
  }

  static async findById(id) {
    return db.categories.find((c) => c.id === id) || null;
  }

  static async create(categoryData) {
    const id = `cat_${Date.now()}`;
    const newCategory = {
      id,
      name: categoryData.name.trim(),
      slug: (categoryData.slug || categoryData.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: categoryData.description || '',
      image_url: categoryData.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      is_active: categoryData.is_active !== undefined ? Boolean(categoryData.is_active) : true,
      created_at: new Date().toISOString(),
    };
    db.categories.push(newCategory);
    saveDatabase();
    return newCategory;
  }

  static async update(id, updateData) {
    const index = db.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    db.categories[index] = { ...db.categories[index], ...updateData };
    saveDatabase();
    return db.categories[index];
  }

  static async delete(id) {
    const index = db.categories.findIndex((c) => c.id === id);
    if (index === -1) return false;
    db.categories.splice(index, 1);
    saveDatabase();
    return true;
  }
}

module.exports = Category;
