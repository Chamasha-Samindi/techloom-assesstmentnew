const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');

// Cancel order and refund
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['Cancelled', 'Refunded', 'Expired', 'Failed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Order is already ${order.status.toLowerCase()}` });
    }

    // Determine if refund is needed
    let message = 'Order cancelled and stock restored.';
    if (order.status === 'Paid') {
      order.status = 'Refunded';
      message = 'Order cancelled, payment refunded, and stock restored.';
    } else {
      order.status = 'Cancelled';
    }

    await order.save();

    // Restore stock safely
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity }, inStock: true });
    }

    res.status(200).json({ success: true, message, data: order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get order history
exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId })
      .populate('items.productId', 'title price imageUrl category')
      .populate('paymentId', 'status transactionId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Checkout & Stock Reservation
exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Fetch Cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const reservedItems = [];
    let checkoutFailed = false;

    // 2. Reserve Stock for each item using atomic operations
    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
        { new: true } // Return updated doc
      );

      if (updatedProduct) {
        // If stock drops to 0, inStock might need update
        if (updatedProduct.stockQuantity === 0) {
           updatedProduct.inStock = false;
           await updatedProduct.save();
        }
        reservedItems.push(item);
      } else {
        checkoutFailed = true;
        break; // Stop processing further items
      }
    }

    // 3. Rollback if any item failed
    if (checkoutFailed) {
      for (const item of reservedItems) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity }, inStock: true });
      }
      return res.status(400).json({ success: false, message: 'Checkout failed. One or more items do not have enough stock.' });
    }

    // 4. Create Order with 'Reserved' status and expiration
    const expirationTime = 5 * 60 * 1000; // 5 minutes
    const expiresAt = new Date(Date.now() + expirationTime);

    const newOrder = await Order.create({
      userId,
      items: cart.items,
      totalAmount: cart.totalPrice,
      status: 'Reserved',
      expiresAt
    });

    // Schedule expiration
    setTimeout(async () => {
      try {
        const orderToCheck = await Order.findById(newOrder._id);
        if (orderToCheck && orderToCheck.status === 'Reserved') {
          orderToCheck.status = 'Expired';
          await orderToCheck.save();
          
          // Restore stock
          for (const item of orderToCheck.items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity }, inStock: true });
          }
          console.log(`Order ${orderToCheck._id} expired. Stock restored.`);
        }
      } catch (err) {
        console.error('Error in expiration timeout:', err);
      }
    }, expirationTime);

    // NOTE: Cart is NOT cleared here anymore. It will be cleared upon successful payment.

    res.status(201).json({ success: true, message: 'Checkout successful. Proceed to payment.', orderId: newOrder._id });

  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Process Mock Payment
exports.processPayment = async (req, res) => {
  try {
    const { orderId, outcome } = req.body;
    const userId = req.user.id;

    if (!['success', 'failure', 'timeout'].includes(outcome)) {
      return res.status(400).json({ success: false, message: 'Invalid payment outcome' });
    }

    const order = await Order.findOne({ _id: orderId, userId });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Reserved') {
      return res.status(400).json({ success: false, message: `Cannot process payment. Order status is ${order.status}` });
    }

    // Check if duplicate payment exists
    const existingPayment = await Payment.findOne({ orderId, status: 'Completed' });
    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'Payment already completed for this order' });
    }

    let paymentStatus = 'Failed';
    let newOrderStatus = 'Failed';

    if (outcome === 'success') {
      paymentStatus = 'Completed';
      newOrderStatus = 'Paid';
    } else if (outcome === 'timeout') {
      paymentStatus = 'Failed';
      newOrderStatus = 'Failed';
    }

    // Create payment record
    const payment = await Payment.create({
      orderId,
      userId,
      amount: order.totalAmount,
      status: paymentStatus,
      transactionId: `mock_txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      paymentMethod: 'mock_card'
    });

    // Update order
    order.status = newOrderStatus;
    order.paymentId = payment._id;
    await order.save();

    if (outcome === 'success') {
      // Clear Cart ONLY on success
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();
      }
      return res.status(200).json({ success: true, message: 'Payment successful', data: { order, payment } });
    } else {
      // If failure/timeout, release stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity }, inStock: true });
      }
      return res.status(400).json({ success: false, message: `Payment ${outcome}` });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
