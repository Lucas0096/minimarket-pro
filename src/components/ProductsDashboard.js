import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import StockAlerts from './StockAlerts';
import { isAdmin, getCurrentMarket, isVendedor, isMarket } from '../utils/auth';
import { getAllData, putData, addData, deleteData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';

const ProductsDashboard = ({ isOnline, selectedMarket }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const savedProducts = await getAllData('products');
      const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
      const productsForMarket = isAdmin() && selectedMarket ? 
        savedProducts.filter(p => p.marketId === selectedMarket) : 
        savedProducts.filter(p => p.marketId === marketToShow);
      
      setAllProducts(productsForMarket);
      setFilteredProducts(productsForMarket);
      
      const savedCategories = JSON.parse(localStorage.getItem('categories')) || ['Alimentos', 'Bebidas', 'Limpieza', 'Fiambres'];
      setCategories(savedCategories);
    };
    loadData();
  }, [selectedMarket]);

  useEffect(() => {
    const results = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    );
    setFilteredProducts(results);
  }, [searchTerm, allProducts]);

  const saveProducts = async (updatedProducts) => {
    const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
    const currentMarketProducts = updatedProducts.filter(p => p.marketId === marketToShow);
    setAllProducts(currentMarketProducts);
    setFilteredProducts(currentMarketProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    ));

    const allExistingProducts = await getAllData('products');
    const otherMarketsProducts = allExistingProducts.filter(p => p.marketId !== marketToShow);
    const finalProductsToSave = [...otherMarketsProducts, ...currentMarketProducts];
    
    for (const product of finalProductsToSave) {
      await putData('products', product);
    }
    syncLocalStorageWithIndexedDB('products', finalProductsToSave);
  };

  const handleAddProduct = async (product) => {
    const marketId = isAdmin() ? product.marketId : getCurrentMarket();
    const productWithMarket = { ...product, marketId };
    const allExistingProducts = await getAllData('products');
    const newProducts = [...allExistingProducts, productWithMarket];
    await addData('products', productWithMarket);
    saveProducts(newProducts);
    setShowForm(false);
  };

  const handleUpdateProduct = async (updatedProduct) => {
    const allExistingProducts = await getAllData('products');
    const newProducts = allExistingProducts.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    await putData('products', updatedProduct);
    saveProducts(newProducts);
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleDeleteProduct = async (id) => {
    await deleteData('products', id);
    const allExistingProducts = await getAllData('products');
    saveProducts(allExistingProducts);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  if (!isAdmin() && !isMarket()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Gestión de Productos</h2>
      {(isAdmin() || isMarket()) && (
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Agregar Producto
        </button>
      )}

      <StockAlerts products={filteredProducts} />

      {showForm && (
        <ProductForm
          categories={categories}
          product={editingProduct}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos por nombre o código de barras..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <ProductList
        products={filteredProducts}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />
    </div>
  );
};

export default ProductsDashboard;