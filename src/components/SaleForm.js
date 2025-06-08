import React, { useState, useEffect, useRef } from 'react';
import { getCurrentMarket } from '../utils/auth';
import CustomerSearchModal from './CustomerSearchModal';
import { getAllData } from '../utils/indexedDb';

const SaleForm = ({ products, onAddSale, onCancel }) => {
  const [saleItems, setSaleItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1); // Cantidad para productos por unidad
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [invoiceType, setInvoiceType] = useState('ticket');
  const [cashReceived, setCashReceived] = useState(0);

  const [showCustomerSearchModal, setShowCustomerSearchModal] = useState(false);
  const [currentAccountCustomer, setCurrentAccountCustomer] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  const barcodeScannerRef = useRef(null);
  const [weightInput, setWeightInput] = useState(0); // Peso en kilogramos (ej. 0.250)
  const weightInputRef = useRef(null);

  useEffect(() => {
    const loadCustomers = async () => {
      const savedCustomers = await getAllData('customers');
      const marketId = getCurrentMarket();
      const customersForMarket = savedCustomers.filter(c => c.marketId === marketId);
      setAllCustomers(customersForMarket);
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const results = products.filter(
        product => 
          (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.barcode && product.barcode.includes(searchTerm))) &&
          product.stock > 0 &&
          !saleItems.some(item => item.productId === product.id)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, products, saleItems]);

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      const scannedBarcode = e.target.value;
      const foundProduct = products.find(p => p.barcode === scannedBarcode);
      if (foundProduct) {
        setSelectedProduct(foundProduct);
        setSearchTerm(foundProduct.name);
        setQuantity(1);
        setWeightInput(0);
        setSearchResults([]);
        barcodeScannerRef.current.value = '';
        if (foundProduct.unit === 'gramos' && weightInputRef.current) {
          weightInputRef.current.focus();
        }
      } else {
        setMessage({ type: 'error', text: `Producto con código ${scannedBarcode} no encontrado.` });
      }
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      setMessage({ type: 'error', text: 'Debe seleccionar un producto.' });
      return;
    }

    let itemQuantity = quantity;
    let itemPrice = selectedProduct.price; // Precio por unidad o por KG
    let itemSubtotal = selectedProduct.price * quantity;
    let displayUnit = selectedProduct.unit;

    if (selectedProduct.unit === 'gramos') {
      if (weightInput <= 0) {
        setMessage({ type: 'error', text: 'Debe ingresar un peso válido para productos por gramo.' });
        return;
      }
      itemQuantity = weightInput; // La cantidad es el peso en gramos
      itemPrice = selectedProduct.price; // Precio por KG
      itemSubtotal = (selectedProduct.price / 1000) * weightInput; // Subtotal basado en peso
      displayUnit = 'kg'; // Mostrar en kg en el carrito
    } else {
      if (quantity <= 0) {
        setMessage({ type: 'error', text: 'Debe ingresar una cantidad válida.' });
        return;
      }
      if (quantity > selectedProduct.stock) {
        setMessage({ type: 'error', text: `No hay suficiente stock para ${selectedProduct.name}. Stock actual: ${selectedProduct.stock}` });
        return;
      }
    }

    const newItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: itemPrice, // Precio por unidad o por KG
      quantity: itemQuantity, // Cantidad de unidades o peso en gramos
      subtotal: itemSubtotal,
      lots: selectedProduct.lots,
      unit: displayUnit // Unidad para mostrar en el ticket/carrito
    };

    setSaleItems([...saleItems, newItem]);
    setSelectedProduct(null);
    setSearchTerm('');
    setQuantity(1);
    setWeightInput(0);
    setSearchResults([]);
    setMessage({ type: '', text: '' });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...saleItems];
    newItems.splice(index, 1);
    setSaleItems(newItems);
  };

  const calculateTotal = () => saleItems.reduce((sum, item) => sum + item.subtotal, 0);
  const calculateSubtotal = () => calculateTotal() / 1.21;
  const calculateTax = () => calculateTotal() - calculateSubtotal();
  const calculateChange = () => {
    if (paymentMethod === 'cash') {
      return cashReceived - calculateTotal();
    }
    return 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (saleItems.length === 0) {
      setMessage({ type: 'error', text: 'No hay productos en el carrito.' });
      return;
    }
    if (paymentMethod === 'cash' && cashReceived < calculateTotal()) {
      setMessage({ type: 'error', text: 'El efectivo recibido es insuficiente.' });
      return;
    }
    if (paymentMethod === 'current_account' && !currentAccountCustomer) {
      setMessage({ type: 'error', text: 'Debe seleccionar un cliente para la cuenta corriente.' });
      return;
    }

    const total = calculateTotal();
    const subtotal = calculateSubtotal();
    const tax = calculateTax();

    const newSale = {
      id: Date.now(),
      date: new Date().toISOString(),
      customerName: currentAccountCustomer ? `${currentAccountCustomer.name} ${currentAccountCustomer.lastName}` : customerName,
      customerDNI: currentAccountCustomer ? currentAccountCustomer.dni : null,
      paymentMethod,
      invoiceType,
      items: saleItems,
      total,
      tax,
      subtotal,
      marketId: getCurrentMarket()
    };

    try {
      onAddSale(newSale);
      if (paymentMethod === 'current_account') {
        setMessage({ type: 'success', text: `Venta agregada con éxito a la cuenta corriente de ${currentAccountCustomer.name} ${currentAccountCustomer.lastName}.` });
      } else {
        setMessage({ type: 'success', text: 'Venta finalizada con éxito.' });
      }
      handlePrintTicket(newSale);
      setSaleItems([]);
      setSearchTerm('');
      setSelectedProduct(null);
      setQuantity(1);
      setWeightInput(0);
      setCustomerName('');
      setPaymentMethod('cash');
      setInvoiceType('ticket');
      setCashReceived(0);
      setCurrentAccountCustomer(null);
    } catch (error) {
      setMessage({ type: 'error', text: `No fue posible agregar la venta: ${error.message || 'Error desconocido'}` });
    }
  };

  const handleConsultPrice = () => {
    if (selectedProduct) {
      alert(`El precio de ${selectedProduct.name} es $${selectedProduct.price.toFixed(2)}.`);
    } else {
      alert('Por favor, selecciona un producto para consultar su precio.');
    }
  };

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setPaymentMethod(method);
    setCashReceived(0);
    if (method === 'current_account') {
      setShowCustomerSearchModal(true);
    } else {
      setCurrentAccountCustomer(null);
    }
  };

  const handleSelectCurrentAccountCustomer = (customer) => {
    setCurrentAccountCustomer(customer);
    setShowCustomerSearchModal(false);
  };

  const handlePrintTicket = (sale) => {
    const printWindow = window.open('', '_blank');
    let ticketContent = `
      <html>
      <head>
        <title>Ticket de Venta</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 58mm; margin: 0 auto; padding: 5mm; }
          .header, .footer { text-align: center; margin-bottom: 5mm; }
          .items { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
          .items th, .items td { padding: 1mm 0; text-align: left; }
          .items th { border-bottom: 1px dashed #000; }
          .total { text-align: right; font-weight: bold; margin-top: 2mm; }
          .line { border-top: 1px dashed #000; margin: 2mm 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h3>MINIMARKET PRO</h3>
          <p>Ticket de ${sale.invoiceType === 'ticket' ? 'Venta' : `Factura ${sale.invoiceType}`}</p>
          <p>Fecha: ${new Date(sale.date).toLocaleString()}</p>
          <p>Cliente: ${sale.customerName || 'Consumidor Final'}</p>
          <div class="line"></div>
        </div>
        
        <table class="items">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity} ${item.unit === 'kg' ? 'kg' : (item.unit === 'gr' ? 'gr' : '')}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="line"></div>
        <div class="total">
          <p>Subtotal: $${sale.subtotal.toFixed(2)}</p>
          <p>IVA (21%): $${sale.tax.toFixed(2)}</p>
          <p>TOTAL: $${sale.total.toFixed(2)}</p>
          <p>Método de Pago: ${sale.paymentMethod}</p>
          ${sale.paymentMethod === 'cash' ? `<p>Efectivo Recibido: $${cashReceived.toFixed(2)}</p><p>Cambio: $${calculateChange().toFixed(2)}</p>` : ''}
        </div>
        <div class="line"></div>
        <div class="footer">
          <p>¡Gracias por su compra!</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(ticketContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Nueva Venta</h3>
      <form onSubmit={handleSubmit}>
        {message.text && (
          <div className={`p-3 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Cliente (Opcional)</label>
            <input
              type="text"
              value={currentAccountCustomer ? `${currentAccountCustomer.name} ${currentAccountCustomer.lastName}` : customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Consumidor Final"
              readOnly={!!currentAccountCustomer}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Comprobante</label>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="ticket">Ticket</option>
              <option value="A">Factura A</option>
              <option value="B">Factura B</option>
              <option value="C">Factura C</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Agregar Productos</h4>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Escanear Código de Barras</label>
              <input
                type="text"
                ref={barcodeScannerRef}
                onKeyDown={handleBarcodeScan}
                placeholder="Escanear producto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">O buscar por nombre</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedProduct(null);
                }}
                placeholder="Buscar producto por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto dark:bg-gray-700">
                  {searchResults.map(product => (
                    <div
                      key={product.id}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${selectedProduct?.id === product.id ? 'bg-blue-50' : ''} dark:hover:bg-gray-600 dark:text-gray-200`}
                      onClick={() => {
                        setSelectedProduct(product);
                        setSearchTerm(product.name);
                        setSearchResults([]);
                      }}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${product.price.toFixed(2)} | Stock: {product.stock} | {product.barcode}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Producto seleccionado</label>
                  <div className="p-2 bg-gray-50 rounded-md dark:bg-gray-700">
                    <div className="font-medium text-gray-800 dark:text-white">{selectedProduct.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">${selectedProduct.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Stock: {selectedProduct.stock}</div>
                    {selectedProduct.lots && selectedProduct.lots.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Vencimiento más próximo: {selectedProduct.lots[0].expiryDate}
                      </div>
                    )}
                  </div>
                </div>
                {selectedProduct.unit === 'gramos' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (gramos)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={weightInput}
                      onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                      ref={weightInputRef}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Precio estimado: ${((selectedProduct.price / 1000) * weightInput).toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(selectedProduct.stock, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Agregar al Carrito
                  </button>
                  <button
                    type="button"
                    onClick={handleConsultPrice}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Consultar Precio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {saleItems.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Productos en Carrito</h4>
            <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Producto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Precio Unit.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Cantidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Subtotal</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {saleItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.quantity} {item.unit === 'gramos' ? 'gr' : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">${item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal (sin IVA):</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${calculateSubtotal().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">IVA (21%):</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${calculateTax().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-2 text-right text-lg font-bold text-gray-800 dark:text-white">Total:</td>
                    <td className="px-4 py-2 whitespace-nowrap text-lg font-bold text-gray-900 dark:text-white">
                      ${calculateTotal().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Método de Pago</label>
          <select
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="cash">Efectivo</option>
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
            <option value="mp">Mercado Pago</option>
            <option value="current_account">Cuenta Corriente</option>
          </select>
        </div>

        {paymentMethod === 'cash' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Efectivo Recibido</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cashReceived}
              onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-lg font-bold text-right mt-2 text-gray-800 dark:text-white">Cambio: ${calculateChange().toFixed(2)}</p>
          </div>
        )}

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
            disabled={saleItems.length === 0 || (paymentMethod === 'cash' && cashReceived < calculateTotal()) || (paymentMethod === 'current_account' && !currentAccountCustomer)}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${saleItems.length === 0 || (paymentMethod === 'cash' && cashReceived < calculateTotal()) || (paymentMethod === 'current_account' && !currentAccountCustomer) ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            Finalizar Venta
          </button>
        </div>
      </form>

      {showCustomerSearchModal && (
        <CustomerSearchModal
          customers={allCustomers}
          onSelectCustomer={handleSelectCurrentAccountCustomer}
          onClose={() => {
            setShowCustomerSearchModal(false);
            setPaymentMethod('cash');
          }}
        />
      )}
    </div>
  );
};

export default SaleForm;