import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Checkout() {
  const [order, setOrder] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  const hasCheckedOut = React.useRef(false);

  useEffect(() => {
    if (hasCheckedOut.current) return;
    hasCheckedOut.current = true;

    const doCheckout = async () => {
      const cartId = localStorage.getItem('cartId');
      if (!cartId) {
        navigate('/');
        return;
      }

      // Generate a simple idempotency key for the UI session, tied to the cart
      let idempotencyKey = sessionStorage.getItem(`chk_${cartId}`);
      if (!idempotencyKey) {
        idempotencyKey = `chk-${cartId}-${Date.now()}`;
        sessionStorage.setItem(`chk_${cartId}`, idempotencyKey);
      }

      try {
        const res = await api.post('/orders', { cartId, idempotencyKey });
        setOrder(res.data.order);
        if (res.data.reservation) {
          setReservation(res.data.reservation);
        }
        localStorage.removeItem('cartId'); // clear cart since it's checked out
      } catch (err) {
        setError(err.response?.data?.message || 'Checkout failed due to insufficient stock or another error.');
      } finally {
        setLoading(false);
      }
    };

    doCheckout();
  }, [navigate]);

  useEffect(() => {
    if (!reservation || !reservation.expiresAt) return;
    if (order?.status !== 'RESERVED') return;

    const expiryTime = new Date(reservation.expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiryTime - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(0);
        // Refresh order status
        refreshOrder();
      } else {
        setTimeLeft(Math.floor(distance / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation, order]);

  const refreshOrder = async () => {
    if (!order) return;
    try {
      const res = await api.get(`/orders/${order._id}`);
      setOrder(res.data.data);
    } catch (err) {
      console.error('Failed to refresh order', err);
    }
  };

  const handlePayment = async (outcome) => {
    try {
      // Mock unique payment ID
      const paymentId = `PAY-${Date.now()}`;
      await api.post(`/orders/${order._id}/payment`, { outcome, paymentId });
      refreshOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment operation failed');
      refreshOrder();
    }
  };

  if (loading) return <div>Processing checkout and reserving stock...</div>;
  if (error) return <div className="text-red-600 font-bold p-6 bg-red-50 border border-red-200 rounded">{error}</div>;
  if (!order) return <div>No order data</div>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border">
      <h1 className="text-3xl font-bold mb-2">Checkout</h1>
      <p className="text-gray-500 mb-8">Order #{order.orderNumber}</p>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="bg-gray-50 p-4 rounded border">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                <span>Product {item.productId?.name || item.productId} x {item.quantity}</span>
                <span className="font-medium">${item.price * item.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 mt-2 border-t font-bold text-lg">
              <span>Total</span>
              <span>${order.total}</span>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-4">Payment & Reservation</h2>
          
          <div className="bg-blue-50 p-6 rounded border border-blue-100 mb-6 text-center">
            <h3 className="text-blue-800 font-medium mb-2">Status: {order.status}</h3>
            
            {order.status === 'RESERVED' && (
              <div>
                <p className="text-sm text-blue-600 mb-1">Stock is reserved. Reservation expires in:</p>
                <div className="text-4xl font-mono font-bold text-blue-700">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
              </div>
            )}
            
            {order.status === 'EXPIRED' && (
              <p className="text-red-600 font-bold">Reservation Expired. Stock released.</p>
            )}
            
            {order.status === 'PAID' && (
              <p className="text-green-600 font-bold">Payment Successful!</p>
            )}
            
            {order.status === 'FAILED' && (
              <p className="text-red-600 font-bold">Payment Failed.</p>
            )}
          </div>

          {order.status === 'RESERVED' && (
            <div className="space-y-3">
              <button 
                onClick={() => handlePayment('success')}
                className="w-full bg-green-600 text-white py-3 rounded font-medium hover:bg-green-700"
              >
                Simulate Payment SUCCESS
              </button>
              <button 
                onClick={() => handlePayment('failed')}
                className="w-full bg-red-500 text-white py-3 rounded font-medium hover:bg-red-600"
              >
                Simulate Payment FAILED
              </button>
              <button 
                onClick={() => handlePayment('timeout')}
                className="w-full bg-gray-500 text-white py-3 rounded font-medium hover:bg-gray-600"
              >
                Simulate Payment TIMEOUT
              </button>
            </div>
          )}
          
          {['PAID', 'EXPIRED', 'FAILED'].includes(order.status) && (
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-gray-900 text-white py-3 rounded font-medium hover:bg-gray-800"
            >
              View All Orders
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Checkout;
