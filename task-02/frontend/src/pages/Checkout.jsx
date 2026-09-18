import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { checkoutCart } from '../services/api';
import MockPaymentGateway from '../components/MockPaymentGateway';
import { ShieldCheck, CheckCircle2, AlertCircle, ShoppingBag, CreditCard, Sparkles } from 'lucide-react';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Determine current step (1: Review, 2: Payment, 3: Success)
  const currentStep = paymentSuccess ? 3 : (order ? 2 : 1);

  // Step 1: Initiate Checkout (Reserves Stock)
  const handleInitiateCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await checkoutCart();
      if (response.data.success) {
        setOrder({
          id: response.data.orderId,
          items: cart.items,
          total: cart.totalPrice
        });
        // Cart is NOT cleared here anymore. It will be cleared upon successful payment.
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Stock may have changed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Payment Gateway Outcomes
  const handlePaymentSuccess = (paymentData) => {
    clearCart();
    setPaymentSuccess(true);
  };

  const handlePaymentFailure = (errorData) => {
    console.log('Payment failed:', errorData);
  };

  if (!cart && !order) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  const StepIndicator = () => (
    <div className="mb-12 relative max-w-3xl mx-auto">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full z-0"></div>
      <div 
        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-emerald-400 -translate-y-1/2 rounded-full z-0 transition-all duration-1000 ease-in-out"
        style={{ width: currentStep === 1 ? '15%' : currentStep === 2 ? '50%' : '100%' }}
      ></div>
      
      <div className="relative z-10 flex justify-between">
        {/* Step 1 */}
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${currentStep >= 1 ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
            <ShoppingBag size={20} />
          </div>
          <span className={`mt-3 font-semibold text-sm ${currentStep >= 1 ? 'text-indigo-400' : 'text-slate-500'}`}>Review</span>
        </div>
        
        {/* Step 2 */}
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${currentStep >= 2 ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 'bg-slate-800 text-slate-500 border-2 border-slate-700'}`}>
            <CreditCard size={20} />
          </div>
          <span className={`mt-3 font-semibold text-sm ${currentStep >= 2 ? 'text-indigo-400' : 'text-slate-500'}`}>Payment</span>
        </div>
        
        {/* Step 3 */}
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${currentStep >= 3 ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-500 border-2 border-slate-700'}`}>
            <Sparkles size={20} />
          </div>
          <span className={`mt-3 font-semibold text-sm ${currentStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>Complete</span>
        </div>
      </div>
    </div>
  );

  if (paymentSuccess) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-700 mt-10">
        <StepIndicator />
        <div className="glass-panel p-12 md:p-20 rounded-[3rem] text-center relative overflow-hidden border border-emerald-500/30">
          <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
              <CheckCircle2 size={64} className="text-emerald-400 relative z-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 mb-6 tracking-tight">Payment Successful!</h1>
            <p className="text-slate-300 text-xl mb-10 font-light">Thank you for your purchase. Your premium order <span className="font-bold text-white">#{order?.id?.substring(0, 8)}</span> is now being processed.</p>
            <button 
              onClick={() => navigate('/orders')}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-4 px-10 rounded-2xl hover:from-emerald-500 hover:to-teal-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 transform hover:-translate-y-1"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-4 border border-indigo-500/20">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">Secure Checkout</h1>
      </div>

      <StepIndicator />

      {!order ? (
        <div className="glass-panel rounded-[2.5rem] p-8 md:p-12 max-w-2xl mx-auto border border-slate-700/50">
          <h2 className="text-2xl font-bold mb-8 text-slate-100 border-b border-slate-700/50 pb-6 flex items-center gap-3">
            Review Your Order
          </h2>
          
          <div className="space-y-4 mb-8">
            {cart.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-4 border-b border-slate-800/50 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                    <img 
                      src={item.productId.imageUrl || `https://loremflickr.com/100/100/${encodeURIComponent(item.productId.category || 'product')}?lock=${item.productId._id.charCodeAt(0)}`} 
                      alt="" className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block group-hover:text-indigo-400 transition-colors">{item.productId.title}</span>
                    <span className="text-sm text-slate-500 font-medium">Qty: {item.quantity}</span>
                  </div>
                </div>
                <span className="font-bold text-emerald-400">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-slate-900/80 p-6 rounded-2xl mb-10 border border-slate-800">
            <span className="text-lg font-medium text-slate-400">Total Amount</span>
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              ${cart.totalPrice.toFixed(2)}
            </span>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 font-medium">
              <AlertCircle size={24} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            onClick={handleInitiateCheckout}
            disabled={loading || cart.items.length === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl py-5 font-bold text-xl hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 relative overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Reserving Stock...
              </span>
            ) : 'Confirm Order & Pay'}
          </button>
          <p className="text-center text-sm text-slate-500 mt-6 flex items-center justify-center gap-2">
            <ShieldCheck size={16} /> By clicking confirm, your items will be reserved.
          </p>
        </div>
      ) : (
        <div className="space-y-8 max-w-2xl mx-auto animate-in slide-in-from-right-10 duration-500">
          <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex items-start gap-4">
            <div className="bg-emerald-500/20 p-2 rounded-full mt-1">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-400 text-lg mb-1">Stock Reserved Successfully</h3>
              <p className="text-slate-300">Your items are securely reserved. Please complete your payment below.</p>
            </div>
          </div>

          <MockPaymentGateway 
            orderId={order.id} 
            onSuccess={handlePaymentSuccess} 
            onFailure={handlePaymentFailure} 
          />
        </div>
      )}
    </div>
  );
};

export default Checkout;
