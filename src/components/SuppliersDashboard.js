import React, { useState, useEffect } from 'react';
import { isAdmin, getCurrentMarket, isMarket } from '../utils/auth';
import { getAllData, putData, addData, deleteData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';
import PdfInvoiceReader from './PdfInvoiceReader';
import ProductMergeModal from './ProductMergeModal';

const SuppliersDashboard = ({ selectedMarket }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    id: Date.now(),
    name: '',
    lastName: '',
    dni: '',
    address: '',
    email: '',
    whatsapp: '',
    paymentMethods: '',
    marketId: ''
  });

  const [invoiceProducts, setInvoiceProducts] = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [productToMerge, setProductToMerge] = useState(null);
  const [existingProductForMerge, setExistingProductForMerge] = useState(null);
  const [currentInvoiceProductIndex, setCurrentInvoiceProductIndex] = useState(0);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const allSuppliers = await getAllData('suppliers');
      const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
      const filteredSuppliers = isAdmin() && selectedMarket ? 
        allSuppliers.filter(s => s.marketId === selectedMarket) : 
        allSuppliers.filter(s => s.marketId === marketToShow);
      
      setSuppliers(filteredSuppliers);
    };
    loadData();
  }, [selectedMarket]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSupplier = async () => {
    const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
    const supplierToSave = { ...formData, marketId };

    const allExistingSuppliers = await getAllData('suppliers');
    let updatedSuppliers;

    if (editingSupplier) {
      updatedSuppliers = allExistingSuppliers.map(s => 
        s.id === editingSupplier.id ? supplierToSave : s
      );
      await putData('suppliers', supplierToSave);
    } else {
      updatedSuppliers = [...allExistingSuppliers, supplierToSave];
      await addData('suppliers', supplierToSave);
    }
    
    syncLocalStorageWithIndexedDB('suppliers', updatedSuppliers);
    
    const filteredSuppliers = isAdmin() && !selectedMarket ? 
      updatedSuppliers : 
      updatedSuppliers.filter(s => s.marketId === marketId);
    setSuppliers(filteredSuppliers);

    setShowForm(false);
    setEditingSupplier(null);
    setFormData({
      id: Date.now(),
      name: '',
      lastName: '',
      dni: '',
      address: '',
      email: '',
      whatsapp: '',
      paymentMethods: '',
      marketId: ''
    });
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowForm(true);
  };

  const handleDeleteSupplier = async (id) => {
    await deleteData('suppliers', id);
    const allExistingSuppliers = await getAllData('suppliers');
    syncLocalStorageWithIndexedDB('suppliers', allExistingSuppliers);

    const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
    const filteredSuppliers = isAdmin() && !selectedMarket ? 
      allExistingSuppliers : 
      allExistingSuppliers.filter(s => s.marketId === marketToShow);
    setSuppliers(filteredSuppliers);
  };

  const handleInvoiceDataExtracted = (data) => {
    setInvoiceProducts(data);
    // No iniciar el procesamiento automático aquí, solo mostrar la tabla
  };

  const processNextInvoiceProduct = async (productsToProcess, index) => {
    setIsProcessingInvoice(true);
    if (index >= productsToProcess.length) {
      alert('Todos los productos de la factura han sido procesados y cargados al inventario.');
      setInvoiceProducts([]);
      setIsProcessingInvoice(false);
      return;
    }

    const item = productsToProcess[index];
    const allExistingProducts = await getAllData('products');
    const existingProduct = allExistingProducts.find(p => p.name === item.description);

    if (existingProduct) {
      setProductToMerge(item);
      setExistingProductForMerge(existingProduct);
      setCurrentInvoiceProductIndex(index);
      setShowMergeModal(true);
    } else {
      await addProductFromInvoice(item, 'new');
      processNextInvoiceProduct(productsToProcess, index + 1);
    }
  };

  const addProductFromInvoice = async (item, action) => {
    const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
    const allExistingProducts = await getAllData('products');
    let updatedProductsList = [...allExistingProducts];

    if (action === 'new') {
      const newProduct = {
        id: Date.now(),
        name: item.description,
        barcode: '',
        category: 'Sin Categoría',
        subcategory: '',
        unit: 'unidad',
        price: item.unitPrice,
        cost: item.unitPrice,
        markup: 0,
        supplier: '',
        minStock: 0,
        image: null,
        marketId: marketId,
        lots: [{ id: Date.now(), quantity: item.quantity, expiryDate: '' }]
      };
      newProduct.stock = newProduct.lots[0].quantity;
      await addData('products', newProduct);
      updatedProductsList.push(newProduct);
    } else if (action === 'update') {
      const existingProduct = allExistingProducts.find(p => p.name === item.description);
      if (existingProduct) {
        const newLot = { id: Date.now(), quantity: item.quantity, expiryDate: '' };
        const updatedLots = [...(existingProduct.lots || []), newLot].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        const updatedStock = updatedLots.reduce((sum, lot) => sum + lot.quantity, 0);
        
        const updatedProduct = {
          ...existingProduct,
          stock: updatedStock,
          lots: updatedLots
        };
        await putData('products', updatedProduct);
        updatedProductsList = updatedProductsList.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      }
    }
    syncLocalStorageWithIndexedDB('products', updatedProductsList);
  };

  const handleMergeConfirm = async (productData, action) => {
    setShowMergeModal(false);
    await addProductFromInvoice(productData, action);
    processNextInvoiceProduct(invoiceProducts, currentInvoiceProductIndex + 1);
  };

  const handleMergeCancel = () => {
    setShowMergeModal(false);
    processNextInvoiceProduct(invoiceProducts, currentInvoiceProductIndex + 1);
  };

  const handleInvoiceProductChange = (id, field, value) => {
    setInvoiceProducts(prevProducts => prevProducts.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice;
        }
        const calculatedSubtotal = updatedItem.quantity * updatedItem.unitPrice;
        const isConsistent = Math.abs(calculatedSubtotal - updatedItem.subtotal) < 0.01;
        return { ...updatedItem, isConsistent };
      }
      return item;
    }));
  };

  const handleAcceptAllInvoiceProducts = () => {
    // Iniciar el proceso de carga uno por uno, manejando las fusiones
    processNextInvoiceProduct(invoiceProducts, 0);
  };

  if (!isAdmin() && !isMarket()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Gestión de Proveedores</h2>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Listado de Proveedores</h3>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setFormData({
              id: Date.now(),
              name: '',
              lastName: '',
              dni: '',
              address: '',
              email: '',
              whatsapp: '',
              paymentMethods: '',
              marketId: ''
            });
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Agregar Proveedor
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6 dark:bg-gray-700">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mercado</label>
                <select
                  name="marketId"
                  value={formData.marketId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  required
                >
                  <option value="">Seleccionar mercado</option>
                  {JSON.parse(localStorage.getItem('markets') || '[]').map(market => (
                    <option key={market.id} value={market.id}>{market.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI</label>
              <input type="text" name="dni" value={formData.dni} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
              <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Métodos de Pago</label>
              <textarea name="paymentMethods" value={formData.paymentMethods} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" rows="3"></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveSupplier}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Guardar Proveedor
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6 dark:bg-gray-700">
        {suppliers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Métodos de Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{supplier.name} {supplier.lastName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.dni}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{supplier.email}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">WhatsApp: {supplier.whatsapp}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{supplier.paymentMethods}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditSupplier(supplier)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 dark:text-gray-300">No hay proveedores registrados en este mercado.</p>
        )}
      </div>

      <div className="mt-8">
        <PdfInvoiceReader onDataExtracted={handleInvoiceDataExtracted} />
        {invoiceProducts.length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
            <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Productos Extraídos de Factura</h4>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Precio Unitario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Subtotal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Inconsistencia</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {invoiceProducts.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleInvoiceProductChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleInvoiceProductChange(item.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleInvoiceProductChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <input
                        type="number"
                        value={item.subtotal}
                        onChange={(e) => handleInvoiceProductChange(item.id, 'subtotal', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {!item.isConsistent && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" title="Inconsistencia detectada">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleAcceptAllInvoiceProducts} className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors" disabled={isProcessingInvoice}>
              {isProcessingInvoice ? 'Cargando...' : 'Cargar Productos al Inventario'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersDashboard;