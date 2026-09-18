const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartService {
  async createCart() {
    const cart = new Cart({ items: [] });
    await cart.save();
    return cart;
  }

  async getCartById(cartId) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;
    
    // Always refresh prices from the DB
    let isModified = false;
    for (let item of cart.items) {
      const product = await Product.findById(item.productId);
      if (product && product.price !== item.priceSnapshot) {
        item.priceSnapshot = product.price;
        isModified = true;
      }
    }
    if (isModified) {
      await cart.save();
    }
    return cart;
  }

  async addItemToCart(cartId, productId, quantity) {
    const cart = await Cart.findById(cartId);
    if (!cart) throw new Error('Cart not found');
    if (cart.status !== 'ACTIVE') throw new Error('Cart is not active');

    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (quantity <= 0) throw new Error('Quantity must be positive');

    const existingItem = cart.items.find(item => item.productId.toString() === productId.toString());
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.priceSnapshot = product.price;
    } else {
      cart.items.push({
        productId,
        quantity,
        priceSnapshot: product.price
      });
    }

    await cart.save();
    return cart;
  }

  async updateItemInCart(cartId, productId, quantity) {
    const cart = await Cart.findById(cartId);
    if (!cart) throw new Error('Cart not found');
    if (cart.status !== 'ACTIVE') throw new Error('Cart is not active');

    if (quantity <= 0) {
      return this.removeItemFromCart(cartId, productId);
    }

    const item = cart.items.find(item => item.productId.toString() === productId.toString());
    if (!item) throw new Error('Item not in cart');

    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    item.quantity = quantity;
    item.priceSnapshot = product.price;

    await cart.save();
    return cart;
  }

  async removeItemFromCart(cartId, productId) {
    const cart = await Cart.findById(cartId);
    if (!cart) throw new Error('Cart not found');
    if (cart.status !== 'ACTIVE') throw new Error('Cart is not active');

    cart.items = cart.items.filter(item => item.productId.toString() !== productId.toString());
    await cart.save();
    return cart;
  }
}

module.exports = new CartService();
