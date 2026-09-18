const Product = require('../models/Product');

class ProductService {
  async createProduct(data) {
    const product = new Product(data);
    await product.save();
    return product;
  }

  async getAllProducts() {
    return Product.find().sort({ createdAt: -1 });
  }

  async getProductById(id) {
    return Product.findById(id);
  }

  async updateProduct(id, data) {
    return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteProduct(id) {
    return Product.findByIdAndDelete(id);
  }
}

module.exports = new ProductService();
