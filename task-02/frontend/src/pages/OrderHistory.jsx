import React, { useState, useEffect } from 'react';
import { getOrderHistory, cancelOrder } from '../services/api';
import { Package, XCircle, RefreshCw, Clock, CheckCircle2, AlertTriangle, Box } from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = async () => {
    try {
      const { data } = await getOrderHistory();
      setOrders(data?.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setActionLoading(orderId);
    try {
      await cancelOrder(orderId);
      // Refresh list to get updated statuses
      await fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid': 
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12} /> Paid</span>;
      case 'Reserved': 
      case 'Pending': 
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> {status}</span>;
      case 'Cancelled': 
      case 'Refunded': 
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><XCircle size={12} /> {status}</span>;
      case 'Expired':
      case 'Failed':
        return <span className="bg-slate-500/20 text-slate-400 border border-slate-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12} /> {status}</span>;
      default: 
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="glass-panel rounded-[2.5rem] p-16 text-center max-w-2xl mx-auto mt-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-800/80 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-700">
          <Package size={48} className="text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 mb-4 tracking-tight">No Orders Yet</h2>
        <p className="text-slate-400 text-lg mb-8 font-light">You haven't placed any orders. Start exploring our premium collection.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-10 border-b border-slate-700/50 pb-6">
        <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
          <Box className="text-indigo-400" size={28} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">Order History</h1>
      </div>

      <div className="space-y-8">
        {orders.map((order) => (
          <div key={order._id} className="glass-panel rounded-3xl overflow-hidden hover:shadow-indigo-500/5 transition-all duration-300">
            {/* Header */}
            <div className="bg-slate-800/50 px-6 md:px-8 py-5 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-semibold">Order Placed</p>
                  <p className="font-bold text-slate-200">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-semibold">Total Amount</p>
                  <p className="font-bold text-emerald-400">${order.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-semibold">Order ID</p>
                  <p className="font-mono font-medium text-slate-300">#{order._id.substring(0, 8)}</p>
                </div>
              </div>
              <div className="self-end md:self-auto">
                {getStatusBadge(order.status)}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Items Included</h4>
              <ul className="space-y-4 mb-8">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center py-3 border-b border-slate-700/30 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 flex-shrink-0 overflow-hidden">
                         <img 
                            src={item.productId?.imageUrl || `https://loremflickr.com/100/100/${encodeURIComponent(item.productId?.category || 'product')}?lock=${item.productId?._id?.charCodeAt(0) || idx}`} 
                            alt="" className="w-full h-full object-cover opacity-80"
                          />
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 block mb-0.5">{item.productId?.title || 'Unknown Product'}</span>
                        <span className="text-sm text-slate-500 font-medium">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-300">${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              {/* Actions */}
              <div className="pt-6 border-t border-slate-700/50 flex justify-end">
                {['Paid', 'Pending', 'Reserved'].includes(order.status) && (
                  <button
                    onClick={() => handleCancel(order._id)}
                    disabled={actionLoading === order._id}
                    className="flex items-center text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 disabled:opacity-50"
                  >
                    {actionLoading === order._id ? (
                      <><RefreshCw size={18} className="mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><XCircle size={18} className="mr-2" /> {order.status === 'Paid' ? 'Cancel & Refund' : 'Cancel Order'}</>
                    )}
                  </button>
                )}
                {['Cancelled', 'Refunded', 'Expired', 'Failed'].includes(order.status) && (
                   <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                     <AlertTriangle size={16} className="text-slate-400" />
                     This order is {order.status.toLowerCase()}. Stock was restored.
                   </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
