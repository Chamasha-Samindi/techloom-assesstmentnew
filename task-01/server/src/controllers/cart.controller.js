const CartService = require('../services/cart.service');
const { validationResult } = require('express-validator');

class CartController {
  async createCart(req, res, next) {
    try {
      const cart = await CartService.createCart();
      res.status(201).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async getCart(req, res, next) {
    try {
      const cart = await CartService.getCartById(req.params.id);
      if (!cart) {
        return res.status(404).json({ success: false, message: 'Cart not found', code: 'CART_NOT_FOUND' });
      }
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { productId, quantity } = req.body;
      const cart = await CartService.addItemToCart(req.params.id, productId, quantity);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      if (error.message === 'Cart not found') {
         return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === 'Product not found') {
         return res.status(404).json({ success: false, message: error.message });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateItem(req, res, next) {
    try {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({ success: false, errors: errors.array() });
       }

       const { quantity } = req.body;
       const cart = await CartService.updateItemInCart(req.params.id, req.params.productId, quantity);
       res.status(200).json({ success: true, data: cart });
    } catch (error) {
       res.status(400).json({ success: false, message: error.message });
    }
  }

  async removeItem(req, res, next) {
    try {
      const cart = await CartService.removeItemFromCart(req.params.id, req.params.productId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CartController();
