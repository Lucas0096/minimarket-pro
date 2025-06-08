import React, { useState, useEffect } from 'react';
import { getAllData } from '../utils/indexedDb';

const CustomerSearchModal = ({ customers, onSelectCustomer, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const results = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.dni.includes(searchTerm)
      );
      setFilteredCustomers(results);
    } else {
      setFilteredCustomers([]);
    }
  }, [searchTerm, customers]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Buscar Cliente para Cuenta Corriente</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, apellido o DNI..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        {filteredCustomers.length > 0 ? (
          <ul className="max-h-60 overflow-y-auto border border-gray-200 rounded-md dark:border-gray-600">
            {filteredCustomers.map(customer => (
              <li 
                key={customer.id} 
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 dark:hover:bg-gray-600 dark:border-gray-700 dark:text-gray-200"
                onClick={() => onSelectCustomer(customer)}
              >
                <div className="font-medium">{customer.name} {customer.lastName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">DNI: {customer.dni} | Tel: {customer.phone}</div>
              </li>
            ))}
          </ul>
        ) : (
          searchTerm.length > 1 && <p className="text-gray-500 text-center dark:text-gray-400">No se encontraron clientes.</p>
        )}
        {searchTerm.length <= 1 && <p className="text-gray-500 text-center dark:text-gray-400">Ingresa al menos 2 caracteres para buscar.</p>}
      </div>
    </div>
  );
};

export default CustomerSearchModal;