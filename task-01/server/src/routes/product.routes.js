const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ProductController = require('../controllers/product.controller');

const productValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('availableStock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

router.post('/', productValidation, ProductController.createProduct);
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.put('/:id', productValidation, ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

module.exports = router;
