const Product = require('../models/Product');

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

  async createProduct(data) {
    const { name, brand, category, price, sizes, stock, description, image } = data;

    if (!name || !brand || !price) {
      throw new Error('Name, brand, and price are required fields.');
    }

    const parsedSizes = Array.isArray(sizes)
      ? sizes.map(Number).filter(Boolean)
      : String(sizes)
          .split(',')
          .map((s) => Number(s.trim()))
          .filter(Boolean);

    return Product.create({
      name: name.trim(),
      brand: brand.trim(),
      category: category ? category.trim() : 'Lifestyle',
      price: parseFloat(price) || 0,
      sizes: parsedSizes.length > 0 ? parsedSizes : [8, 9, 10, 11],
      stock: parseInt(stock, 10) || 0,
      description: description ? description.trim() : '',
      image: image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      featured: Boolean(data.featured),
    });
  }

  async updateProduct(id, data) {
    await this.getProductById(id); // Ensure exists

    const updatePayload = { ...data };
    if (updatePayload.price) updatePayload.price = parseFloat(updatePayload.price);
    if (updatePayload.stock !== undefined) updatePayload.stock = parseInt(updatePayload.stock, 10);
    if (updatePayload.sizes && typeof updatePayload.sizes === 'string') {
      updatePayload.sizes = updatePayload.sizes
        .split(',')
        .map((s) => Number(s.trim()))
        .filter(Boolean);
    }

    return Product.update(id, updatePayload);
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    return Product.delete(id);
  }
}

module.exports = new ProductService();
