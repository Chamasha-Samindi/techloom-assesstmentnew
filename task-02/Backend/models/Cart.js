const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: String, // Mock user ID for this implementation
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Method to calculate total price
cartSchema.methods.calculateTotal = function() {
  this.totalPrice = this.items.reduce((total, item) => total + (item.quantity * item.price), 0);
};

module.exports = mongoose.model('Cart', cartSchema);
