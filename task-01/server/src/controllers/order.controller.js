const CheckoutService = require('../services/checkout.service');
const PaymentService = require('../services/payment.service');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const mongoose = require('mongoose');

class OrderController {
  async checkout(req, res, next) {
    try {
      const { cartId, idempotencyKey } = req.body;
      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: 'cartId is required',
          code: 'MISSING_CART_ID',
        });
      }

      // Validate cartId is a valid ObjectId to avoid cast errors
      if (!mongoose.Types.ObjectId.isValid(cartId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cartId format',
          code: 'INVALID_CART_ID',
        });
      }

      const result = await CheckoutService.checkout(cartId, idempotencyKey);
      res.status(200).json(result);
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message,
        code: error.code || 'CHECKOUT_ERROR',
      });
    }
  }

  async processPayment(req, res, next) {
    try {
      const { outcome, paymentId } = req.body;
      if (!outcome) {
        return res.status(400).json({ success: false, message: 'outcome is required', code: 'MISSING_OUTCOME' });
      }
      const result = await PaymentService.processPayment(req.params.orderId, outcome, paymentId);
      res.status(200).json(result);
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ success: false, message: error.message, code: error.code || 'PAYMENT_ERROR' });
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const result = await PaymentService.cancelOrder(req.params.orderId);
      res.status(200).json(result);
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ success: false, message: error.message, code: error.code || 'CANCEL_ERROR' });
    }
  }

  async getOrder(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID', code: 'INVALID_ORDER_ID' });
      }
      const order = await Order.findById(req.params.orderId).populate('items.productId');
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      }
      // Also attach current reservation details for the frontend countdown
      const reservation = order.reservationId
        ? await Reservation.findById(order.reservationId)
        : null;

      res.status(200).json({ success: true, data: { ...order.toObject(), reservationDetails: reservation } });
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
