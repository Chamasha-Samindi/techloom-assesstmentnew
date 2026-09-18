import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api';
import { Search, Filter, ShoppingBag } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [inStock, setInStock] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      if (inStock) params.inStock = inStock;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const { data } = await getProducts(params);
      setProducts(data?.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, inStock]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient pb-2">
          Discover Premium
        </h1>
        <form onSubmit={handleSearch} className="relative w-full md:w-96 flex glass-card rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
          <input
            type="text"
            placeholder="Search our collection..."
            className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-slate-200 placeholder-slate-400 focus:outline-none"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Search className="absolute left-4 top-4 text-slate-400" size={20} />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 font-semibold transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-72 glass-card p-6 rounded-3xl h-fit sticky top-24 shrink-0">
          <div className="flex items-center gap-3 font-bold text-xl mb-8 text-slate-200 border-b border-slate-700 pb-4">
            <Filter size={24} className="text-indigo-400" /> Refine Search
          </div>
          
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Category</label>
              <div className="relative">
                <select 
                  className="w-full p-3.5 appearance-none bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Home">Home</option>
                  <option value="Books">Books</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Price Range</label>
              <div className="flex items-center space-x-3">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-1/2 p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-slate-500 font-bold">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-1/2 p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <button 
                onClick={fetchProducts}
                className="mt-4 w-full bg-slate-800 border border-slate-600 text-slate-200 py-3 rounded-xl hover:bg-slate-700 transition-colors text-sm font-bold uppercase tracking-wider"
              >
                Apply Range
              </button>
            </div>

            <div className="flex items-center pt-4 border-t border-slate-700">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    type="checkbox" 
                    id="inStock"
                    className="w-5 h-5 bg-slate-900 border-slate-600 rounded text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="inStock" className="font-semibold text-slate-300 cursor-pointer select-none">
                    Show In-Stock Only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <div className="bg-slate-800/80 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={40} className="text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-200 mb-3">No collections found</h3>
              <p className="text-slate-400">Try adjusting your filters or searching for something else.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
              {products.map((product, index) => {
                // Make the first item larger if it's the first in the row (desktop only)
                const isFeatured = index % 5 === 0;
                
                return (
                  <Link 
                    to={`/products/${product._id}`} 
                    key={product._id} 
                    className={`group ${isFeatured ? 'md:col-span-2' : ''}`}
                  >
                    <div className="glass-card rounded-3xl p-4 h-full flex flex-col hover:-translate-y-2 hover:scale-[1.02] hover:shadow-indigo-500/10 transition-all duration-300">
                      <div className={`relative rounded-2xl overflow-hidden mb-5 ${isFeatured ? 'h-64' : 'h-48'}`}>
                        {/* High-quality placeholder image using loremflickr */}
                        <img 
                          src={product.imageUrl || `https://loremflickr.com/800/600/${encodeURIComponent(product.category || 'product')}?lock=${product._id.charCodeAt(product._id.length-1)}`} 
                          alt={product.title} 
                          className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                        
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-rose-500/90 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase shadow-lg shadow-rose-500/20">
                              Out of Stock
                            </span>
                          </div>
                        )}
                        
                        <div className="absolute bottom-4 left-4">
                          <span className="bg-slate-900/80 backdrop-blur-md text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                            {product.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col px-2 pb-2">
                        <h3 className={`font-bold text-slate-100 mb-2 line-clamp-2 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
                          {product.title}
                        </h3>
                        <div className="mt-auto flex items-end justify-between pt-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-400 font-medium mb-1">{product.stockQuantity} available</span>
                            <span className={`font-black text-emerald-400 ${isFeatured ? 'text-3xl' : 'text-2xl'}`}>
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
