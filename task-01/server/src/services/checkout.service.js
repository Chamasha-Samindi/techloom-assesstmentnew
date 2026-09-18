const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Reservation = require('../models/Reservation');
const Order = require('../models/Order');

class CheckoutService {
  async checkout(cartId, idempotencyKey) {
    // Fast-path idempotency: return existing order without starting a transaction.
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        const reservation = await Reservation.findById(existingOrder.reservationId);
        return {
          success: true,
          order: existingOrder,
          reservation: reservation || null,
          message: 'Returned existing order (idempotent)',
        };
      }
    }

    const session = await mongoose.startSession();
    let result;

    try {
      // session.withTransaction automatically retries the transaction if a 
      // WriteConflict or TransientTransactionError occurs!
      await session.withTransaction(async () => {
        // Read cart inside transaction
        const cart = await Cart.findById(cartId).session(session);
        if (!cart) {
          const err = new Error('Cart not found');
          err.statusCode = 404;
          err.code = 'CART_NOT_FOUND';
          throw err;
        }
        if (cart.status !== 'ACTIVE') {
          const err = new Error('Cart is already checked out');
          err.statusCode = 409;
          err.code = 'CART_ALREADY_CHECKED_OUT';
          throw err;
        }
        if (cart.items.length === 0) {
          const err = new Error('Cart is empty');
          err.statusCode = 400;
          err.code = 'CART_EMPTY';
          throw err;
        }

        let subtotal = 0;
        const orderItems = [];
        const reservationItems = [];

        // Atomically reserve stock for each product.
        for (const item of cart.items) {
          const product = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              availableStock: { $gte: item.quantity },
            },
            {
              $inc: { availableStock: -item.quantity },
            },
            { new: true, session }
          );

          if (!product) {
            const actualProduct = await Product.findById(item.productId).session(session);
            const name = actualProduct ? actualProduct.name : String(item.productId);
            const err = new Error(`Insufficient stock for product: ${name}`);
            err.statusCode = 409;
            err.code = 'INSUFFICIENT_STOCK';
            throw err; // Aborts the transaction
          }

          const itemTotal = product.price * item.quantity;
          subtotal += itemTotal;

          orderItems.push({
            productId: product._id,
            quantity: item.quantity,
            price: product.price,
          });

          reservationItems.push({
            productId: product._id,
            quantity: item.quantity,
          });
        }

        // Generate a collision-resistant order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const order = new Order({
          orderNumber,
          cartId: cart._id,
          items: orderItems,
          subtotal,
          total: subtotal,
          status: 'RESERVED',
          idempotencyKey: idempotencyKey || undefined,
        });

        await order.save({ session });

        // Create Reservation that expires in exactly 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const reservation = new Reservation({
          orderId: order._id,
          cartId: cart._id,
          items: reservationItems,
          status: 'ACTIVE',
          expiresAt,
        });

        await reservation.save({ session });

        // Back-link the reservation into the order
        order.reservationId = reservation._id;
        await order.save({ session });

        // Mark cart as checked out so it cannot be re-used
        cart.status = 'CHECKED_OUT';
        await cart.save({ session });

        // Store the result to return it after the transaction commits
        result = { success: true, order, reservation };

      }, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      return result;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new CheckoutService();
