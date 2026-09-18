const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get user cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ userId }).populate('items.productId', 'title price stockQuantity imageUrl category');
    
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    } else {
      // Clean up orphaned items (products that were deleted from the database)
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => item.productId != null);
      
      if (cart.items.length !== originalLength) {
        cart.calculateTotal();
        await cart.save();
      }
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({ success: false, message: 'Not enough stock available' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
    
    if (itemIndex > -1) {
      // Update quantity if already in cart
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({ productId, quantity, price: product.price });
    }

    cart.calculateTotal();
    await cart.save();
    
    // Populate before sending response to keep frontend state consistent
    await cart.populate('items.productId', 'title price stockQuantity imageUrl category');

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock before updating
      const product = await Product.findById(productId);
      if (product.stockQuantity < quantity) {
        return res.status(400).json({ success: false, message: 'Not enough stock available' });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    cart.calculateTotal();
    await cart.save();

    await cart.populate('items.productId', 'title price stockQuantity imageUrl category');

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(p => p.productId.toString() !== productId);
    cart.calculateTotal();
    await cart.save();

    await cart.populate('items.productId', 'title price stockQuantity imageUrl category');

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

