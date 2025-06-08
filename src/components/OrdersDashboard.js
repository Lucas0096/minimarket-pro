import React, { useState, useEffect } from 'react';
import { getCurrentMarket, isAdmin, isMarket } from '../utils/auth';
import { getAllData, putData, addData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';

const OrdersDashboard = ({ selectedMarket }) => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState({}); // { supplierId: [{ product, quantity }] }
  const [manualSupplier, setManualSupplier] = useState(''); // Para seleccionar proveedor en adición manual
  const [manualProductId, setManualProductId] = useState(''); // Para seleccionar producto en adición manual
  const [manualQuantity, setManualQuantity] = useState(1); // Cantidad para adición manual

  useEffect(() => {
    const loadData = async () => {
      const allProducts = await getAllData('products');
      const allSuppliers = await getAllData('suppliers');
      const allSales = await getAllData('sales');

      const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
      const filteredProducts = isAdmin() && selectedMarket ? 
        allProducts.filter(p => p.marketId === selectedMarket) : 
        allProducts.filter(p => p.marketId === marketToShow);
      
      const filteredSuppliers = isAdmin() && selectedMarket ?
        allSuppliers.filter(s => s.marketId === selectedMarket) :
        allSuppliers.filter(s => s.marketId === marketToShow);

      setProducts(filteredProducts);
      setSuppliers(filteredSuppliers);

      generateAutomaticOrders(filteredProducts, allSales, filteredSuppliers);
    };
    loadData();
  }, [selectedMarket]);

  const generateAutomaticOrders = (currentProducts, allSales, currentSuppliers) => {
    const newOrders = {};
    const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
    const salesForMarket = allSales.filter(s => s.marketId === marketId);

    currentProducts.forEach(product => {
      if (product.stock <= product.minStock) {
        const supplier = currentSuppliers.find(s => s.id === product.supplier);
        const supplierName = supplier ? `${supplier.name} ${supplier.lastName}` : 'Sin Proveedor';
        
        if (!newOrders[supplierName]) {
          newOrders[supplierName] = [];
        }

        let suggestedQuantity = 0;
        const productSalesHistory = salesForMarket.filter(sale => 
          sale.items.some(item => item.productId === product.id)
        );

        if (productSalesHistory.length > 0) {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          const salesLastMonth = productSalesHistory.filter(sale => new Date(sale.date) >= oneMonthAgo);
          
          if (salesLastMonth.length > 0) {
            const totalSoldLastMonth = salesLastMonth.reduce((sum, sale) => {
              const item = sale.items.find(i => i.productId === product.id);
              return sum + (item ? item.quantity : 0);
            }, 0);
            suggestedQuantity = Math.ceil(totalSoldLastMonth / (salesLastMonth.length / 30)) * 30;
            if (suggestedQuantity < product.minStock * 2) {
              suggestedQuantity = product.minStock * 2;
            }
          } else {
            suggestedQuantity = product.minStock * 2;
          }
        } else {
          suggestedQuantity = 10;
        }
        
        suggestedQuantity = Math.max(suggestedQuantity, product.minStock - product.stock);

        newOrders[supplierName].push({
          product: product,
          quantity: suggestedQuantity
        });
      }
    });
    setOrders(newOrders);
  };

  const handleManualAddProduct = (supplierName, productId, quantity) => {
    const productToAdd = products.find(p => p.id === productId);
    if (!productToAdd || quantity <= 0) return;

    setOrders(prevOrders => {
      const updatedOrders = { ...prevOrders };
      if (!updatedOrders[supplierName]) {
        updatedOrders[supplierName] = [];
      }
      const existingItemIndex = updatedOrders[supplierName].findIndex(item => item.product.id === productId);
      if (existingItemIndex > -1) {
        updatedOrders[supplierName][existingItemIndex].quantity += quantity;
      } else {
        updatedOrders[supplierName].push({ product: productToAdd, quantity: quantity });
      }
      return updatedOrders;
    });
  };

  const handleRemoveProduct = (supplierName, productId) => {
    setOrders(prevOrders => {
      const updatedOrders = { ...prevOrders };
      if (updatedOrders[supplierName]) {
        updatedOrders[supplierName] = updatedOrders[supplierName].filter(item => item.product.id !== productId);
        if (updatedOrders[supplierName].length === 0) {
          delete updatedOrders[supplierName];
        }
      }
      return updatedOrders;
    });
  };

  const handleQuantityChange = (supplierName, productId, newQuantity) => {
    setOrders(prevOrders => {
      const updatedOrders = { ...prevOrders };
      if (updatedOrders[supplierName]) {
        const itemIndex = updatedOrders[supplierName].findIndex(item => item.product.id === productId);
        if (itemIndex > -1) {
          updatedOrders[supplierName][itemIndex].quantity = parseInt(newQuantity) || 0;
        }
      }
      return updatedOrders;
    });
  };

  const handleAddManualItemToOrder = () => {
    if (!manualSupplier || !manualProductId || manualQuantity <= 0) {
      alert('Por favor, selecciona un proveedor, un producto y una cantidad.');
      return;
    }
    const supplierObj = suppliers.find(s => s.id === manualSupplier);
    const supplierName = supplierObj ? `${supplierObj.name} ${supplierObj.lastName}` : 'Sin Proveedor';
    handleManualAddProduct(supplierName, parseInt(manualProductId), manualQuantity);
    setManualSupplier('');
    setManualProductId('');
    setManualQuantity(1);
  };

  if (!isAdmin() && !isMarket()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Gestión de Pedidos</h2>

      <button
        onClick={() => generateAutomaticOrders(products, JSON.parse(localStorage.getItem('sales')) || [], suppliers)}
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Generar Pedidos Automáticos
      </button>

      <div className="mb-8 p-4 border border-gray-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Agregar Producto Manualmente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={manualSupplier}
            onChange={(e) => {
              setManualSupplier(e.target.value);
              setManualProductId(''); // Resetear producto al cambiar proveedor
            }}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          >
            <option value="">Seleccionar Proveedor</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name} {supplier.lastName}</option>
            ))}
          </select>
          <select
            value={manualProductId}
            onChange={(e) => setManualProductId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            disabled={!manualSupplier}
          >
            <option value="">Seleccionar Producto</option>
            {products.filter(p => p.supplier === manualSupplier).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={manualQuantity}
            onChange={(e) => setManualQuantity(parseInt(e.target.value) || 1)}
            placeholder="Cantidad"
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
        <button
          onClick={handleAddManualItemToOrder}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Agregar al Pedido
        </button>
      </div>

      {Object.keys(orders).length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300">No hay pedidos automáticos generados o todos los productos están en stock.</p>
      ) : (
        Object.entries(orders).map(([supplier, items]) => (
          <div key={supplier} className="mb-8 p-4 border border-gray-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Proveedor: {supplier}</h3>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Stock Actual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Cantidad a Pedir</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {items.map(item => (
                  <tr key={item.product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(supplier, item.product.id, e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-center dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveProduct(supplier, item.product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Enviar Pedido (Simulado)
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default OrdersDashboard;