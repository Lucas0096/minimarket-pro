import React, { useState, useEffect } from 'react';
import SaleForm from './SaleForm';
import SalesHistory from './SalesHistory';
import { isAdmin, getCurrentMarket, isMarket, isVendedor } from '../utils/auth';
import { getAllData, putData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';

const SalesDashboard = ({ isOnline, selectedMarket }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const allSales = await getAllData('sales');
      const allProducts = await getAllData('products');
      
      const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
      const filteredSales = isAdmin() && selectedMarket ? 
        allSales.filter(s => s.marketId === selectedMarket) : 
        allSales.filter(s => s.marketId === marketToShow);
      
      const filteredProducts = isAdmin() && selectedMarket ? 
        allProducts.filter(p => p.marketId === selectedMarket) : 
        allProducts.filter(p => p.marketId === marketToShow);

      setSales(filteredSales);
      setProducts(filteredProducts);
    };
    loadData();
  }, [selectedMarket]);

  const saveSales = async (updatedSales) => {
    setSales(updatedSales);
    syncLocalStorageWithIndexedDB('sales', updatedSales);
  };

  const handleAddSale = async (sale) => {
    const newSales = [...sales, sale];
    await putData('sales', sale);
    saveSales(newSales);
    
    const allExistingProducts = await getAllData('products');
    const updatedProducts = allExistingProducts.map(product => {
      const soldItem = sale.items.find(item => item.productId === product.id);
      if (soldItem) {
        let remainingQuantity = soldItem.quantity;
        const sortedLots = [...product.lots].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        const updatedLots = [];

        for (let i = 0; i < sortedLots.length && remainingQuantity > 0; i++) {
          const currentLot = { ...sortedLots[i] };
          if (currentLot.quantity >= remainingQuantity) {
            currentLot.quantity -= remainingQuantity;
            remainingQuantity = 0;
          } else {
            remainingQuantity -= currentLot.quantity;
            currentLot.quantity = 0;
          }
          updatedLots.push(currentLot);
        }
        
        const finalLots = updatedLots.filter(lot => lot.quantity > 0);
        const newTotalStock = finalLots.reduce((sum, lot) => sum + lot.quantity, 0);

        return {
          ...product,
          stock: newTotalStock,
          lots: finalLots
        };
      }
      return product;
    });
    
    for (const product of updatedProducts) {
      await putData('products', product);
    }
    syncLocalStorageWithIndexedDB('products', updatedProducts);
    
    setProducts(updatedProducts.filter(p => p.marketId === (isAdmin() ? selectedMarket : getCurrentMarket())));
    
    setShowForm(false);
  };

  if (!isAdmin() && !isMarket() && !isVendedor()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Gestión de Ventas</h2>
      {(isAdmin() || isMarket() || isVendedor()) && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Nueva Venta
        </button>
      )}

      {showForm && (
        <SaleForm
          products={products}
          onAddSale={handleAddSale}
          onCancel={() => setShowForm(false)}
        />
      )}

      <SalesHistory sales={sales} products={products} />
    </div>
  );
};

export default SalesDashboard;