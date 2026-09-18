import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/api';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, Check, AlertTriangle, ShieldCheck, Truck } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await getProductById(id);
        setProduct(data?.data || null);
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !product.inStock) return;
    setAdding(true);
    setError(null);
    try {
      await addItem(product._id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

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

  if (error && !product) {
    return (
      <div className="glass-panel p-16 rounded-3xl text-center max-w-2xl mx-auto mt-12">
        <AlertTriangle size={64} className="mx-auto text-rose-500 mb-6 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
        <h2 className="text-3xl font-bold text-slate-200 mb-4">Oops! {error}</h2>
        <p className="text-slate-400 mb-8">The product you are looking for might have been removed or is temporarily unavailable.</p>
        <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors">
          Return to Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-slate-400 hover:text-indigo-400 transition-colors mb-8 group font-medium"
      >
        <div className="bg-slate-800 p-2 rounded-full mr-3 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        Back to Products
      </button>

      <div className="glass-panel rounded-[2.5rem] overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="lg:w-1/2 relative bg-slate-800/30 p-8 lg:p-12 flex items-center justify-center overflow-hidden min-h-[400px]">
            {/* Background blur effect behind image */}
            <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full scale-150 transform-gpu pointer-events-none"></div>
            
            <img 
              src={product.imageUrl || `https://loremflickr.com/800/800/${encodeURIComponent(product.category || 'product')}?lock=${product._id.charCodeAt(product._id.length-1)}`} 
              alt={product.title} 
              className="relative z-10 w-full h-auto max-w-md rounded-2xl shadow-2xl shadow-slate-900/50 transform hover:scale-105 transition-transform duration-700" 
            />
          </div>

          {/* Details Section */}
          <div className="lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center relative">
            <div className="mb-4">
              <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                {product.category}
              </span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-100 mb-6 tracking-tight leading-tight">
              {product.title}
            </h1>
            
            <p className="text-slate-400 mb-10 text-lg leading-relaxed font-light">
              {product.description}
            </p>
            
            <div className="flex items-end gap-6 mb-10 pb-10 border-b border-slate-700/50">
              <span className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                ${product.price.toFixed(2)}
              </span>
              <div className="flex flex-col pb-1">
                <span className={`text-sm font-bold uppercase tracking-wider ${product.inStock ? 'text-indigo-400' : 'text-rose-400'}`}>
                  {product.inStock ? 'In Stock' : 'Out of stock'}
                </span>
                {product.inStock && (
                  <span className="text-xs text-slate-500">{product.stockQuantity} units available</span>
                )}
              </div>
            </div>

            {/* Feature Tags */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center text-slate-300 gap-3">
                <div className="bg-slate-800 p-2.5 rounded-xl text-indigo-400">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-sm font-medium">1 Year Warranty</span>
              </div>
              <div className="flex items-center text-slate-300 gap-3">
                <div className="bg-slate-800 p-2.5 rounded-xl text-emerald-400">
                  <Truck size={20} />
                </div>
                <span className="text-sm font-medium">Fast Shipping</span>
              </div>
            </div>

            {error && product && (
               <div className="mb-6 text-rose-300 bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                 <AlertTriangle size={18} />
                 {error}
               </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
              <div className="flex items-center border border-slate-600 rounded-2xl h-16 w-full sm:w-40 bg-slate-800/50 overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-bold text-xl"
                  disabled={!product.inStock}
                >-</button>
                <input 
                  type="number" 
                  className="w-full h-full text-center bg-transparent font-bold text-xl text-slate-200 focus:outline-none" 
                  value={quantity}
                  readOnly
                />
                <button 
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-bold text-xl"
                  disabled={!product.inStock}
                >+</button>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={!product.inStock || adding || added}
                className={`flex-1 h-16 w-full rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 overflow-hidden relative ${
                  added ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' :
                  !product.inStock ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' :
                  'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1'
                }`}
              >
                {added ? (
                  <span className="flex items-center gap-2 animate-in zoom-in duration-300">
                    <Check size={24} /> Added to Cart
                  </span>
                ) : adding ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingCart size={24} /> 
                    {!product.inStock ? 'Out of Stock' : 'Add to Cart'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
