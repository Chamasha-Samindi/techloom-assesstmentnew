import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const { data } = await getCart();
      setCart(data?.data || { items: [], totalPrice: 0 });
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addItem = async (productId, quantity) => {
    try {
      const { data } = await addToCart(productId, quantity);
      if (data?.data) setCart(data.data);
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateItem = async (productId, quantity) => {
    try {
      const { data } = await updateCartItem(productId, quantity);
      if (data?.data) setCart(data.data);
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  };

  const removeItem = async (productId) => {
    try {
      const { data } = await removeFromCart(productId);
      if (data?.data) setCart(data.data);
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw error;
    }
  };

  const clearCart = () => {
    setCart({ items: [], totalPrice: 0 }); // Local clear after successful checkout
  };

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};
