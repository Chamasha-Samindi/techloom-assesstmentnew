import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Home } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { cart } = useCart();
  const itemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package size={24} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">E-Shop</span>
          </Link>
          <div className="flex space-x-6">
            <Link to="/" className="hover:text-blue-400 transition-colors flex items-center space-x-1">
              <Home size={18} />
              <span>Products</span>
            </Link>
            <Link to="/orders" className="hover:text-blue-400 transition-colors flex items-center space-x-1">
              <Package size={18} />
              <span>Orders</span>
            </Link>
            <Link to="/cart" className="relative hover:text-blue-400 transition-colors flex items-center space-x-1">
              <ShoppingCart size={18} />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
