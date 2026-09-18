import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="font-sans text-slate-200 bg-slate-900 relative overflow-hidden min-h-screen flex flex-col">
          {/* Decorative background elements */}
          <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <Navbar />
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<OrderHistory />} />
            </Routes>
          </main>
          </div>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
