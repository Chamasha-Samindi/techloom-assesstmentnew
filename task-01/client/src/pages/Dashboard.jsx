import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin form
  const [newProduct, setNewProduct] = useState({ name: '', price: '', availableStock: '' });

  const [editingProductId, setEditingProductId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', price: '', availableStock: '' });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: newProduct.name,
        price: Number(newProduct.price),
        availableStock: Number(newProduct.availableStock)
      });
      setNewProduct({ name: '', price: '', availableStock: '' });
      fetchProducts();
    } catch (err) {
      alert('Error creating product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const startEditing = (product) => {
    setEditingProductId(product._id);
    setEditFormData({
      name: product.name,
      price: product.price,
      availableStock: product.availableStock
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.put(`/products/${id}`, {
        name: editFormData.name,
        price: Number(editFormData.price),
        availableStock: Number(editFormData.availableStock)
      });
      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      alert('Error updating product');
    }
  };

  const addToCart = async (productId) => {
    try {
      // For demo, we just use a single cart id stored in localStorage
      let cartId = localStorage.getItem('cartId');
      if (!cartId) {
        const res = await api.post('/carts');
        cartId = res.data.data._id;
        localStorage.setItem('cartId', cartId);
      }

      await api.post(`/carts/${cartId}/items`, { productId, quantity: 1 });
      alert('Added to cart!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding to cart');
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory (Admin/Demo View)</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h2 className="text-lg font-medium mb-4">Create New Product</h2>
        <form onSubmit={handleAddProduct} className="flex gap-4">
          <input
            type="text"
            placeholder="Name"
            required
            className="border rounded p-2 flex-1"
            value={newProduct.name}
            onChange={e => setNewProduct({...newProduct, name: e.target.value})}
          />
          <input
            type="number"
            placeholder="Price"
            min="0"
            required
            className="border rounded p-2 w-32"
            value={newProduct.price}
            onChange={e => setNewProduct({...newProduct, price: e.target.value})}
          />
          <input
            type="number"
            placeholder="Stock"
            min="0"
            required
            className="border rounded p-2 w-32"
            value={newProduct.availableStock}
            onChange={e => setNewProduct({...newProduct, availableStock: e.target.value})}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">Add Product</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => {
          const isEditing = editingProductId === product._id;
          
          return (
            <div key={product._id} className="bg-white p-6 rounded-lg shadow-sm border flex flex-col justify-between relative">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    className="border rounded p-1 w-full font-bold"
                    value={editFormData.name}
                    onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                  />
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-600">$</span>
                    <input
                      type="number"
                      className="border rounded p-1 w-full text-gray-600"
                      min="0"
                      value={editFormData.price}
                      onChange={e => setEditFormData({...editFormData, price: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-gray-600">Stock:</span>
                    <input
                      type="number"
                      className="border rounded p-1 w-full text-sm"
                      min="0"
                      value={editFormData.availableStock}
                      onChange={e => setEditFormData({...editFormData, availableStock: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleSaveEdit(product._id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex-1 font-medium hover:bg-green-700">Save</button>
                    <button onClick={() => setEditingProductId(null)} className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm flex-1 font-medium hover:bg-gray-400">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => startEditing(product)} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                    <button onClick={() => handleDeleteProduct(product._id)} className="text-red-600 text-sm font-medium hover:underline">Delete</button>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg pr-16">{product.name}</h3>
                    <p className="text-gray-600 text-xl mt-2">${product.price}</p>
                    <p className={`mt-2 text-sm font-medium ${product.availableStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.availableStock} in stock
                    </p>
                  </div>
                </>
              )}
              
              {!isEditing && (
                <button
                  onClick={() => addToCart(product._id)}
                  disabled={product.availableStock === 0}
                  className={`mt-4 w-full py-2 rounded font-medium ${product.availableStock > 0 ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                >
                  Add to Cart
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
