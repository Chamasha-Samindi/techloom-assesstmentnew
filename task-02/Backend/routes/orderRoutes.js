const express = require('express');
const { cancelOrder, getOrderHistory, checkout, processPayment } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All order routes require authentication

router.route('/history')
  .get(getOrderHistory);

router.route('/:id/cancel')
  .post(cancelOrder);

router.route('/checkout')
  .post(checkout);

router.route('/payment')
  .post(processPayment);

module.exports = router;
