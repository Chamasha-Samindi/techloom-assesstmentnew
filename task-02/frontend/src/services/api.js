import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
});

// Add a request interceptor to attach the mock user ID
api.interceptors.request.use(
  (config) => {
    // Generate a unique user ID if one doesn't exist for this browser
    let userId = localStorage.getItem('mockUserId');
    if (!userId) {
      userId = 'user-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('mockUserId', userId);
    }
    
    config.headers['x-user-id'] = userId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getProducts = (params) => api.get('/products', { params });
export const getProductById = (id) => api.get(`/products/${id}`);

export const getCart = () => api.get('/cart');
export const addToCart = (productId, quantity) => api.post('/cart', { productId, quantity });
export const updateCartItem = (productId, quantity) => api.put(`/cart/${productId}`, { quantity });
export const removeFromCart = (productId) => api.delete(`/cart/${productId}`);
export const checkoutCart = () => api.post('/orders/checkout');

export const processPayment = (orderId, outcome) => api.post('/orders/payment', { orderId, outcome });

export const getOrderHistory = () => api.get('/orders/history');
export const cancelOrder = (orderId) => api.post(`/orders/${orderId}/cancel`);

export default api;
