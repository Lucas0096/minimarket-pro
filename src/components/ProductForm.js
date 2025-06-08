import React, { useState, useRef, useEffect } from 'react';
import { isAdmin, getCurrentMarket } from '../utils/auth';

const ProductForm = ({ categories, product, onAddProduct, onUpdateProduct, onCancel }) => {
  const [formData, setFormData] = useState(product || {
    id: Date.now(),
    name: '',
    barcode: '',
    category: categories[0] || '',
    subcategory: '',
    unit: 'unidad',
    price: 0,
    cost: 0,
    markup: 0,
    supplier: '',
    minStock: 0,
    image: null,
    marketId: '',
    lots: []
  });
  const [barcodeInput, setBarcodeInput] = useState('');
  const fileInputRef = useRef(null);
  const [markets, setMarkets] = useState([]);
  const [availableSuppliers, setAvailableSuppliers] = useState([]);

  const [newLotQuantity, setNewLotQuantity] = useState(0);
  const [newLotExpiryDate, setNewLotExpiryDate] = useState(''); // Corregido: Usar setNewLotExpiryDate

  // Estados para búsqueda de categorías/subcategorías
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [subcategorySearchTerm, setSubcategorySearchTerm] = useState('');

  // Subcategorías de ejemplo (en un sistema real, esto vendría de una DB o API)
  const allSubcategories = {
    'Alimentos': ['Lácteos', 'Panadería', 'Carnes', 'Verduras', 'Frutas', 'Congelados', 'Despensa'],
    'Bebidas': ['Gaseosas', 'Jugos', 'Aguas', 'Cervezas', 'Vinos', 'Licores'],
    'Limpieza': ['Hogar', 'Ropa', 'Cocina', 'Baño', 'Pisos'],
    'Fiambres': ['Jamones', 'Quesos', 'Embutidos', 'Salames'],
    'Otros': ['Varios']
  };

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const filteredSubcategories = (allSubcategories[formData.category] || []).filter(subcat =>
    subcat.toLowerCase().includes(subcategorySearchTerm.toLowerCase())
  );

  useEffect(() => {
    const allMarkets = JSON.parse(localStorage.getItem('markets')) || [];
    setMarkets(allMarkets);

    const allSuppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
    const marketId = isAdmin() ? (product ? product.marketId : (allMarkets.length > 0 ? allMarkets[0].id : '')) : getCurrentMarket();
    const filteredSuppliers = allSuppliers.filter(s => s.marketId === marketId);
    setAvailableSuppliers(filteredSuppliers);

    if (!product && isAdmin() && allMarkets.length > 0) {
      setFormData(prev => ({ ...prev, marketId: allMarkets[0].id }));
    }
    if (product && !formData.marketId) {
      setFormData(prev => ({ ...prev, marketId: product.marketId }));
    }
  }, [product]);

  useEffect(() => {
    if (isAdmin() && formData.marketId) {
      const allSuppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
      const filteredSuppliers = allSuppliers.filter(s => s.marketId === formData.marketId);
      setAvailableSuppliers(filteredSuppliers);
      if (formData.supplier && !filteredSuppliers.some(s => s.id === formData.supplier)) {
        setFormData(prev => ({ ...prev, supplier: '' }));
      }
    }
  }, [formData.marketId, isAdmin]);

  useEffect(() => {
    const finalPrice = formData.cost * (1 + formData.markup / 100);
    if (finalPrice !== formData.price) {
      setFormData(prev => ({ ...prev, price: parseFloat(finalPrice.toFixed(2)) }));
    }
  }, [formData.cost, formData.markup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'cost' || name === 'minStock' || name === 'markup'
        ? parseFloat(value) || 0 
        : value
    });
  };

  const handleAddLot = () => {
    if (newLotQuantity > 0 && newLotExpiryDate) {
      const newLot = {
        id: Date.now(),
        quantity: newLotQuantity,
        expiryDate: newLotExpiryDate
      };
      setFormData(prev => ({
        ...prev,
        lots: [...prev.lots, newLot].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      }));
      setNewLotQuantity(0);
      setNewLotExpiryDate('');
    }
  };

  const handleRemoveLot = (lotId) => {
    setFormData(prev => ({
      ...prev,
      lots: prev.lots.filter(lot => lot.id !== lotId)
    }));
  };

  const handleEditLotQuantity = (lotId, newQuantity) => {
    setFormData(prev => ({
      ...prev,
      lots: prev.lots.map(lot => 
        lot.id === lotId ? { ...lot, quantity: parseInt(newQuantity) || 0 } : lot
      )
    }));
  };

  const handleBarcodeScan = (e) => {
    e.preventDefault();
    setFormData({
      ...formData,
      barcode: barcodeInput
    });
    setBarcodeInput('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalStock = formData.lots.reduce((sum, lot) => sum + lot.quantity, 0);
    const productToSave = { ...formData, stock: totalStock };

    if (product) {
      onUpdateProduct(productToSave);
    } else {
      onAddProduct(productToSave);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        {product ? 'Editar Producto' : 'Agregar Nuevo Producto'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAdmin() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mercado</label>
              <select
                name="marketId"
                value={formData.marketId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Seleccionar mercado</option>
                {markets.map(market => (
                  <option key={market.id} value={market.id}>{market.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código de Barras</label>
            <div className="flex">
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Escanear o ingresar manualmente"
              />
              <button
                type="button"
                onClick={() => {
                  const randomBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
                  setFormData({...formData, barcode: randomBarcode});
                }}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md dark:bg-gray-600 dark:hover:bg-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
            <div className="relative">
              <input
                type="text"
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mt-1"
              >
                {filteredCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategoría</label>
            <div className="relative">
              <input
                type="text"
                value={subcategorySearchTerm}
                onChange={(e) => setSubcategorySearchTerm(e.target.value)}
                placeholder="Buscar subcategoría..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mt-1"
              >
                {(allSubcategories[formData.category] || []).length > 0 ? (
                  filteredSubcategories.map(subcat => (
                    <option key={subcat} value={subcat}>{subcat}</option>
                  ))
                ) : (
                  <option value="">Selecciona una categoría primero</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad de Medida</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="unidad">Unidad</option>
              <option value="gramos">Gramos (por Kg)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Seleccionar proveedor</option>
              {availableSuppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name} {supplier.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">% Sobreprecio</label>
            <input
              type="number"
              name="markup"
              value={formData.markup}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio de Venta (Calculado)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Mínimo</label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen del Producto</label>
            <div className="flex items-center space-x-4">
              {formData.image ? (
                <div className="relative">
                  <img src={formData.image} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, image: null})}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 bg-gray-200 rounded-md flex items-center justify-center dark:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {formData.image ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Gestión de Lotes (Ingreso de Stock)</h4>
          <div className="flex space-x-2 mb-4">
            <input
              type="number"
              value={newLotQuantity}
              onChange={(e) => setNewLotQuantity(parseInt(e.target.value) || 0)}
              placeholder="Cantidad"
              min="1"
              className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              type="date"
              value={newLotExpiryDate}
              onChange={(e) => setNewLotExpiryDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddLot}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Agregar Lote
            </button>
          </div>
          {formData.lots.length > 0 ? (
            <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Cantidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Fecha Vencimiento</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {formData.lots.map(lot => (
                    <tr key={lot.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="number"
                          min="0"
                          value={lot.quantity}
                          onChange={(e) => handleEditLotQuantity(lot.id, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{lot.expiryDate}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleRemoveLot(lot.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-300">No hay lotes agregados para este producto.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {product ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;