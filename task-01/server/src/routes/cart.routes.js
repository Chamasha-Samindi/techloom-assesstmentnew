const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const CartController = require('../controllers/cart.controller');

const itemValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

router.post('/', CartController.createCart);
router.get('/:id', CartController.getCart);
router.post('/:id/items', itemValidation, CartController.addItem);
router.patch('/:id/items/:productId', [body('quantity').isInt({ min: 0 }).withMessage('Quantity must be >= 0')], CartController.updateItem);
router.delete('/:id/items/:productId', CartController.removeItem);

module.exports = router;
