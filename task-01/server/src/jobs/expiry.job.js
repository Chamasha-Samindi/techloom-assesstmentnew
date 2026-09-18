const cron = require('node-cron');
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Reservation Expiry Background Job
 *
 * Runs every minute.  Finds ACTIVE reservations whose expiresAt has passed and:
 *   1. Marks the reservation EXPIRED
 *   2. Atomically restores availableStock for every reserved product
 *   3. Marks the associated Order EXPIRED
 *
 * Idempotency: we re-fetch the reservation inside the transaction with
 * `status: 'ACTIVE'` — if it has already been handled (by a payment, another
 * job run, or the cancellation endpoint) the inner query returns null and the
 * transaction is aborted without touching any data.
 */
const startExpiryJob = () => {
  cron.schedule('* * * * *', async () => {
    // Guard: don't run if DB is not connected
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    try {
      const now = new Date();
      const expiredReservations = await Reservation.find(
        { status: 'ACTIVE', expiresAt: { $lt: now } },
        '_id'  // Only fetch the ID — we re-read inside the transaction
      ).lean();

      for (const { _id: reservationId } of expiredReservations) {
        const session = await mongoose.startSession();
        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        });

        try {
          // Re-fetch inside transaction — this is the idempotency guard.
          // If another process already handled this, status won't be 'ACTIVE'.
          const activeRes = await Reservation.findOne({
            _id: reservationId,
            status: 'ACTIVE',
          }).session(session);

          if (!activeRes) {
            // Already handled by a payment/cancellation — skip safely
            await session.abortTransaction();
            session.endSession();
            continue;
          }

          activeRes.status = 'EXPIRED';
          activeRes.releasedAt = now;
          await activeRes.save({ session });

          // Restore stock for every reserved item
          for (const item of activeRes.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { availableStock: item.quantity } },
              { session }
            );
          }

          // Expire the associated order if it is still RESERVED
          if (activeRes.orderId) {
            await Order.updateOne(
              { _id: activeRes.orderId, status: 'RESERVED' },
              { $set: { status: 'EXPIRED', expiredAt: now } },
              { session }
            );
          }

          await session.commitTransaction();
          console.log(`[ExpiryJob] Expired reservation ${activeRes._id}`);
        } catch (err) {
          await session.abortTransaction();
          console.error(`[ExpiryJob] Error expiring reservation ${reservationId}:`, err.message);
        } finally {
          session.endSession();
        }
      }
    } catch (error) {
      console.error('[ExpiryJob] Outer error:', error.message);
    }
  });
};

module.exports = { startExpiryJob };
