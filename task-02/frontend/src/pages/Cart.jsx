import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

const Cart = () => {
  const { cart, loading, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-10 md:p-20 text-center max-w-3xl mx-auto mt-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative w-64 h-64 mx-auto mb-10 group">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
          <img
            src="https://images.unsplash.com/photo-1557821552-17105153ce9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Empty Cart Illustration"
            className="w-full h-full object-cover rounded-full shadow-2xl relative z-10 border-4 border-slate-800"
          />
          <div className="absolute -bottom-6 -right-6 bg-slate-800 rounded-full p-6 shadow-2xl z-20 border-4 border-slate-900">
            <ShoppingBag size={40} className="text-indigo-400" />
          </div>
        </div>
        <h2 className="text-4xl font-extrabold text-slate-100 mb-4 tracking-tight">Your cart is feeling light</h2>
        <p className="text-slate-400 text-lg mb-10 font-light max-w-lg mx-auto">
          Explore our collection of premium products and find something you'll absolutely love.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-4 px-10 rounded-2xl hover:from-indigo-500 hover:to-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all duration-300">
          <ArrowLeft size={20} /> Start Exploring
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">Your Cart</h1>
        <span className="text-slate-400 font-medium bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          {cart.items.length} {cart.items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="glass-panel rounded-3xl overflow-hidden">
            <ul className="divide-y divide-slate-700/50">
              {cart?.items?.map((item, idx) => (
                <li key={item?.productId?._id || idx} className="p-6 md:p-8 flex flex-col sm:flex-row gap-8 hover:bg-slate-800/30 transition-colors">
                  <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 shadow-inner group">
                    <img
                      src={item?.productId?.imageUrl || 'https://via.placeholder.com/400?text=No+Image'}
                      alt={item?.productId?.title || 'Unknown Product'}
                      className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 text-xl font-bold text-slate-100">
                        <h3 className="line-clamp-2 leading-tight">
                          <Link to={`/products/${item?.productId?._id}`} className="hover:text-indigo-400 transition-colors">
                            {item?.productId?.title || 'Unknown Product'}
                          </Link>
                        </h3>
                        <p className="text-emerald-400 whitespace-nowrap">${((item?.price || 0) * (item?.quantity || 1)).toFixed(2)}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-md">
                          ${(item?.price || 0).toFixed(2)} each
                        </span>
                        <span className="text-xs text-indigo-400 font-medium">
                          {item?.productId?.stockQuantity || 0} in stock
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 items-end justify-between mt-6">
                      <div className="flex items-center border border-slate-600 rounded-xl bg-slate-900/50 h-12 overflow-hidden">
                        <button
                          onClick={() => updateItem(item?.productId?._id, Math.max(1, (item?.quantity || 1) - 1))}
                          disabled={!item?.productId?._id}
                          className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-bold disabled:opacity-50"
                        >-</button>
                        <span className="w-12 h-full flex items-center justify-center font-bold text-slate-200 border-x border-slate-600">
                          {item?.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateItem(item?.productId?._id, (item?.quantity || 1) + 1)}
                          disabled={!item?.productId?._id}
                          className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-bold disabled:opacity-50"
                        >+</button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item?.productId?._id)}
                        disabled={!item?.productId?._id}
                        className="font-semibold text-rose-400 hover:text-white flex items-center bg-rose-500/10 hover:bg-rose-500 px-4 py-2.5 rounded-xl transition-all duration-300 border border-rose-500/20 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] disabled:opacity-50"
                      >
                        <Trash2 size={18} className="mr-2" /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-[400px]">
          <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900/80 backdrop-blur-xl border border-indigo-500/20 text-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-10 sticky top-24">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              Order Summary
              <div className="h-1 flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent rounded-full"></div>
            </h2>

            <div className="space-y-5 mb-8 text-slate-300 font-medium">
              <div className="flex justify-between items-center">
                <p>Subtotal</p>
                <p className="text-lg text-white">${(cart?.totalPrice || 0).toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p>Shipping</p>
                <p className="text-sm text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md">Calculated at checkout</p>
              </div>
              <div className="flex justify-between items-center">
                <p>Tax</p>
                <p className="text-sm text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md">Calculated at checkout</p>
              </div>
            </div>

            <div className="border-t border-indigo-500/30 pt-8 mb-10 flex justify-between items-end">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Amount</p>
                <p className="text-xl font-bold">USD</p>
              </div>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                ${(cart?.totalPrice || 0).toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-r from-indigo-500 to-emerald-400 text-white rounded-2xl py-5 font-bold text-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 flex justify-center items-center group hover:-translate-y-1"
            >
              Proceed to Checkout
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-2 transition-transform" />
            </button>
            <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Secure 256-bit SSL encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
