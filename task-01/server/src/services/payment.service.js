const mongoose = require('mongoose');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Refund = require('../models/Refund');
const Product = require('../models/Product');

class PaymentService {
  async processPayment(orderId, outcome, paymentId) {
    const session = await mongoose.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          const err = new Error('Order not found');
          err.statusCode = 404;
          throw err;
        }

        // Idempotency: same paymentId already applied → return stored result
        if (paymentId && order.paymentId === paymentId) {
          result = { success: true, order, message: 'Payment already processed with this ID' };
          return;
        }

        // Reject payment on any terminal state
        if (order.status !== 'RESERVED') {
          const err = new Error(`Cannot process payment: order is in '${order.status}' state`);
          err.statusCode = 409;
          err.code = 'INVALID_ORDER_STATE';
          throw err;
        }

        const reservation = await Reservation.findById(order.reservationId).session(session);
        if (!reservation || reservation.status !== 'ACTIVE') {
          const err = new Error('Reservation is not active — it may have already expired');
          err.statusCode = 409;
          err.code = 'RESERVATION_NOT_ACTIVE';
          throw err;
        }

        if (outcome === 'success') {
          order.status = 'PAID';
          order.paymentId = paymentId;
          order.paidAt = new Date();

          reservation.status = 'CONSUMED';
          reservation.releasedAt = new Date();

        } else if (outcome === 'failed') {
          order.status = 'FAILED';
          order.paymentId = paymentId;

          reservation.status = 'RELEASED';
          reservation.releasedAt = new Date();
          await this._restoreStock(reservation.items, session);

        } else if (outcome === 'timeout') {
          order.status = 'EXPIRED';
          order.expiredAt = new Date();

          reservation.status = 'EXPIRED';
          reservation.releasedAt = new Date();
          await this._restoreStock(reservation.items, session);

        } else {
          const err = new Error(`Invalid payment outcome: '${outcome}'. Must be success, failed, or timeout`);
          err.statusCode = 400;
          throw err;
        }

        await order.save({ session });
        await reservation.save({ session });

        result = { success: true, order };
      }, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      return result;
    } finally {
      session.endSession();
    }
  }

  async cancelOrder(orderId) {
    const session = await mongoose.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          const err = new Error('Order not found');
          err.statusCode = 404;
          throw err;
        }

        // Already in a terminal cancelled/failed state — idempotent, return as-is
        if (['CANCELLED', 'EXPIRED', 'FAILED', 'REFUNDED'].includes(order.status)) {
          result = { success: true, order, message: 'Order already in a terminal state' };
          return;
        }

        const reservation = await Reservation.findById(order.reservationId).session(session);

        if (order.status === 'RESERVED') {
          order.status = 'CANCELLED';
          order.cancelledAt = new Date();

          if (reservation && reservation.status === 'ACTIVE') {
            reservation.status = 'RELEASED';
            reservation.releasedAt = new Date();
            await this._restoreStock(reservation.items, session);
            await reservation.save({ session });
          }

        } else if (order.status === 'PAID') {
          order.status = 'REFUNDED';
          order.cancelledAt = new Date();

          const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          const refund = new Refund({
            refundId,
            paymentId: order.paymentId || `SIM-PAY-${order._id}`,
            orderId: order._id,
            amount: order.total,
            status: 'SUCCESS',
          });
          await refund.save({ session });

          await this._restoreStock(order.items, session);
        }

        await order.save({ session });

        result = { success: true, order };
      }, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      return result;
    } finally {
      session.endSession();
    }
  }

  /**
   * Atomically restores stock for each item.  Uses $inc — never reads before
   * writing, so this is safe to call from within a transaction.
   */
  async _restoreStock(items, session) {
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { availableStock: item.quantity } },
        { session }
      );
    }
  }
}

module.exports = new PaymentService();
