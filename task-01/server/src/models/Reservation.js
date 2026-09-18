const mongoose = require('mongoose');

const reservationItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
    },
    items: [reservationItemSchema],
    status: {
      type: String,
      enum: ['ACTIVE', 'RELEASED', 'EXPIRED', 'CONSUMED'],
      default: 'ACTIVE',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    releasedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
