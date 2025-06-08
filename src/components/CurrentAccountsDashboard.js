import React, { useState, useEffect } from 'react';
import { getCurrentMarket, isAdmin, isMarket } from '../utils/auth';
import CustomerForm from './CustomerForm';
import { getAllData, putData, addData, deleteData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';

const CurrentAccountsDashboard = ({ selectedMarket }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const allSales = await getAllData('sales');
      const savedCustomers = await getAllData('customers');
      
      const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
      const filteredSales = isAdmin() && selectedMarket ? 
        allSales.filter(s => s.marketId === selectedMarket) : 
        allSales.filter(s => s.marketId === marketToShow);
      
      const customersForMarket = isAdmin() && selectedMarket ? 
        savedCustomers.filter(c => c.marketId === selectedMarket) : 
        savedCustomers.filter(c => c.marketId === marketToShow);

      setSales(filteredSales);
      setAllCustomers(customersForMarket);

      const currentAccountCustomers = {};
      filteredSales.forEach(sale => {
        if (sale.paymentMethod === 'current_account' && sale.customerName) {
          if (!currentAccountCustomers[sale.customerName]) {
            currentAccountCustomers[sale.customerName] = {
              name: sale.customerName,
              dni: sale.customerDNI,
              address: sale.customerAddress,
              email: sale.customerEmail,
              phone: sale.customerPhone,
              totalDebt: 0,
              sales: []
            };
          }
          currentAccountCustomers[sale.customerName].totalDebt += sale.total;
          currentAccountCustomers[sale.customerName].sales.push(sale);
        }
      });
      setCustomers(Object.values(currentAccountCustomers));
    };
    loadData();
  }, [selectedMarket]);

  const handleSelectCustomer = (customerName) => {
    const customer = customers.find(c => c.name === customerName);
    setSelectedCustomer(customer);
    setCustomerSales(customer ? customer.sales : []);
  };

  const handleMarkAsPaid = async (saleId) => {
    const allSales = await getAllData('sales');
    const updatedSales = allSales.map(sale => 
      sale.id === saleId ? { ...sale, paymentMethod: 'paid_current_account', paidDate: new Date().toISOString() } : sale
    );
    await putData('sales', updatedSales.find(s => s.id === saleId));
    syncLocalStorageWithIndexedDB('sales', updatedSales);

    const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
    const filteredSales = isAdmin() && selectedMarket ? 
      updatedSales.filter(s => s.marketId === selectedMarket) : 
      updatedSales.filter(s => s.marketId === marketToShow);
    setSales(filteredSales);

    const currentAccountCustomers = {};
    filteredSales.forEach(sale => {
      if (sale.paymentMethod === 'current_account' && sale.customerName) {
        if (!currentAccountCustomers[sale.customerName]) {
          currentAccountCustomers[sale.customerName] = {
            name: sale.customerName,
            dni: sale.customerDNI,
            address: sale.customerAddress,
            email: sale.customerEmail,
            phone: sale.customerPhone,
            totalDebt: 0,
            sales: []
          };
        }
        currentAccountCustomers[sale.customerName].totalDebt += sale.total;
        currentAccountCustomers[sale.customerName].sales.push(sale);
      }
    });
    setCustomers(Object.values(currentAccountCustomers));
    setSelectedCustomer(null);
  };

  const handleSendReminder = (customer) => {
    alert(`Simulando envío de recordatorio a ${customer.name} (${customer.phone}) por $${customer.totalDebt.toFixed(2)}`);
  };

  const handleExportCustomerHistory = (customer) => {
    alert(`Simulando exportación de historial de ${customer.name} a PDF/Excel.`);
  };

  const handleSaveCustomer = async (customerData) => {
    const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
    const customerWithMarket = { ...customerData, marketId };
    
    const allExistingCustomers = await getAllData('customers');
    let updatedCustomers;

    if (editingCustomer) {
      updatedCustomers = allExistingCustomers.map(c => c.id === customerData.id ? customerWithMarket : c);
      await putData('customers', customerWithMarket);
    } else {
      updatedCustomers = [...allExistingCustomers, customerWithMarket];
      await addData('customers', customerWithMarket);
    }
    
    syncLocalStorageWithIndexedDB('customers', updatedCustomers);
    
    const customersForMarket = isAdmin() && !selectedMarket ? 
      updatedCustomers : 
      updatedCustomers.filter(c => c.marketId === marketId);
    setAllCustomers(customersForMarket);
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    await deleteData('customers', customerId);
    const allExistingCustomers = await getAllData('customers');
    syncLocalStorageWithIndexedDB('customers', allExistingCustomers);

    const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
    const customersForMarket = isAdmin() && !selectedMarket ? 
      allExistingCustomers : 
      allExistingCustomers.filter(c => c.marketId === marketToShow);
    setAllCustomers(customersForMarket);
  };

  if (!isAdmin() && !isMarket()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Cuentas Corrientes</h2>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Gestión de Clientes</h3>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowCustomerForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Agregar Cliente
        </button>
      </div>

      {showCustomerForm && (
        <CustomerForm
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => setShowCustomerForm(false)}
        />
      )}

      <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
        <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Listado de Clientes Registrados</h4>
        {allCustomers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {allCustomers.map(customer => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer.name} {customer.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{customer.dni}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
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
          <p className="text-gray-500 dark:text-gray-300">No hay clientes registrados en este mercado.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Clientes con Deuda</h3>
          {customers.length > 0 ? (
            <ul className="space-y-2">
              {customers.map(customer => (
                <li 
                  key={customer.name} 
                  className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${selectedCustomer?.name === customer.name ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600'} dark:text-gray-300`}
                  onClick={() => handleSelectCustomer(customer.name)}
                >
                  <span>{customer.name}</span>
                  <span className="font-bold text-red-600">${customer.totalDebt.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-300">No hay clientes con cuentas corrientes pendientes.</p>
          )}
        </div>

        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
          {selectedCustomer ? (
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Detalle de Deuda: {selectedCustomer.name}</h3>
              <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                <p><strong>DNI:</strong> {selectedCustomer.dni}</p>
                <p><strong>Dirección:</strong> {selectedCustomer.address}</p>
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Teléfono:</strong> {selectedCustomer.phone}</p>
                <p className="text-xl font-bold text-red-600 mt-2">Deuda Total: ${selectedCustomer.totalDebt.toFixed(2)}</p>
              </div>

              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => handleSendReminder(selectedCustomer)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Enviar Recordatorio (WhatsApp)
                </button>
                <button
                  onClick={() => handleExportCustomerHistory(selectedCustomer)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Exportar Historial
                </button>
              </div>

              <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Ventas Pendientes</h4>
              {customerSales.filter(s => s.paymentMethod === 'current_account').length > 0 ? (
                <div className="bg-white p-4 rounded-md dark:bg-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Productos</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {customerSales.filter(s => s.paymentMethod === 'current_account').map(sale => (
                        <tr key={sale.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(sale.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{sale.items.map(item => item.name).join(', ')}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">${sale.total.toFixed(2)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleMarkAsPaid(sale.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Marcar como Pagada
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-300">Este cliente no tiene ventas pendientes a cuenta corriente.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-300">Selecciona un cliente para ver su detalle de cuenta corriente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentAccountsDashboard;