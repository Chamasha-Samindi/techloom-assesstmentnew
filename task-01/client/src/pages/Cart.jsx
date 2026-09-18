import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Cart() {
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [quantities, setQuantities] = useState({});

  const fetchCart = async () => {
    const cartId = localStorage.getItem('cartId');
    if (!cartId) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/carts/${cartId}`);
      const data = res.data?.data;
      setCart(data);

      // Initialize local quantities
      const qs = {};
      if (data && data.items) {
        data.items.forEach(item => {
          qs[item.productId] = item.quantity;
        });
      }
      setQuantities(qs);

      // Fetch product details for names
      const prodRes = await api.get('/products');
      const prodMap = {};
      if (prodRes.data?.data) {
        prodRes.data.data.forEach(p => {
          prodMap[p._id] = p;
        });
      }
      setProducts(prodMap);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        localStorage.removeItem('cartId');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = (productId, val) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
    const qty = Number(val);
    if (qty > 0) {
      updateQuantity(productId, qty);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      await api.patch(`/carts/${cart._id}/items/${productId}`, { quantity });
      fetchCart();
    } catch (err) {
      alert('Error updating quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/carts/${cart._id}/items/${productId}`);
      fetchCart();
    } catch (err) {
      alert('Error removing item');
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    navigate('/checkout');
  };

  if (loading) return <div>Loading cart...</div>;
  if (!cart || cart.items.length === 0) return <div className="text-center mt-20 text-gray-500">Your cart is empty.</div>;

  let total = 0;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cart.items.map(item => {
              const product = products[item.productId];
              const name = product ? product.name : 'Unknown';
              const itemTotal = item.priceSnapshot * item.quantity;
              total += itemTotal;
              
              return (
                <tr key={item.productId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.priceSnapshot}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input 
                      type="number" 
                      min="1"
                      className="border rounded w-16 p-1 text-center"
                      value={quantities[item.productId] !== undefined ? quantities[item.productId] : item.quantity}
                      onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${itemTotal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => removeItem(item.productId)} className="text-red-600 hover:text-red-900">Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
           <div className="text-lg font-bold text-gray-900">Total: ${total}</div>
           <button 
             onClick={handleCheckout}
             disabled={cart.status !== 'ACTIVE'}
             className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400"
           >
             Proceed to Checkout
           </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
