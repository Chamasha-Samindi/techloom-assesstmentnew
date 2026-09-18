const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const { body } = require('express-validator');

router.post('/', OrderController.checkout);
router.get('/', OrderController.getAllOrders);
router.get('/:orderId', OrderController.getOrder);
router.post('/:orderId/payment', [
  body('outcome').isIn(['success', 'failed', 'timeout']).withMessage('Invalid outcome')
], OrderController.processPayment);
router.post('/:orderId/cancel', OrderController.cancelOrder);

module.exports = router;
