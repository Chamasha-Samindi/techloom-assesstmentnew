import React, { useState } from 'react';
import { processPayment } from '../services/api';
import { CheckCircle, XCircle, Clock, CreditCard, ShieldCheck } from 'lucide-react';

const MockPaymentGateway = ({ orderId, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Simulated card details for visual flair
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/25');
  const [cvc, setCvc] = useState('•••');
  const [name, setName] = useState('JANE DOE');

  const handlePayment = async (outcome) => {
    setLoading(true);
    setError(null);
    try {
      const response = await processPayment(orderId, outcome);
      if (response.data.success) {
        onSuccess(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
      if (onFailure) {
        onFailure(err.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] border border-slate-700/50 shadow-2xl relative overflow-hidden">
      {/* Decorative background for gateway */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-10 border-b border-slate-700/50 pb-6 relative z-10">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-100 flex items-center gap-3">
            <CreditCard className="text-indigo-400" /> Payment Details
          </h3>
          <p className="text-sm text-slate-400 mt-1">Simulate a payment gateway response</p>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-5 bg-slate-700 rounded-sm"></div>
          <div className="w-8 h-5 bg-slate-700 rounded-sm"></div>
          <div className="w-8 h-5 bg-slate-700 rounded-sm"></div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-500/10 text-rose-300 font-medium rounded-xl border border-rose-500/30 flex items-center gap-3 relative z-10">
          <XCircle size={20} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Realistic Credit Card UI */}
      <div className="relative w-full max-w-sm mx-auto h-56 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl mb-12 border border-slate-700 overflow-hidden group hover:scale-[1.02] transition-transform duration-500 z-10">
        {/* Card decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8 pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="w-12 h-10 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded-md opacity-80 shadow-sm"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/80 mix-blend-screen"></div>
            <div className="w-8 h-8 rounded-full bg-yellow-500/80 mix-blend-screen -ml-4"></div>
          </div>
        </div>
        
        <div className="mb-6 relative z-10">
          <p className="text-2xl font-mono text-slate-200 tracking-[0.15em] drop-shadow-md">{cardNumber}</p>
        </div>
        
        <div className="flex justify-between items-end relative z-10">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Card Holder</p>
            <p className="font-bold text-slate-200 tracking-wider text-sm">{name}</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Expires</p>
              <p className="font-bold text-slate-200 tracking-wider text-sm">{expiry}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">CVC</p>
              <p className="font-bold text-slate-200 tracking-wider text-sm">{cvc}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-6 relative z-10">
        <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Select Payment Outcome</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handlePayment('success')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <CheckCircle className="text-emerald-400 mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300" size={36} />
            <span className="font-bold text-emerald-300 tracking-wide">Success</span>
          </button>

          <button
            onClick={() => handlePayment('failure')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]"
          >
            <XCircle className="text-rose-400 mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300" size={36} />
            <span className="font-bold text-rose-300 tracking-wide">Failure</span>
          </button>

          <button
            onClick={() => handlePayment('timeout')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <Clock className="text-amber-400 mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300" size={36} />
            <span className="font-bold text-amber-300 tracking-wide">Timeout</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-[2.5rem]">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-300 font-bold tracking-widest uppercase animate-pulse">Processing Transaction</p>
        </div>
      ) : (
        <p className="text-center mt-8 text-xs text-slate-500 flex items-center justify-center gap-2 relative z-10">
          <ShieldCheck size={14} /> End-to-end encrypted mock environment
        </p>
      )}
    </div>
  );
};

export default MockPaymentGateway;
