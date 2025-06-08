import React, { useState, useEffect } from 'react';
import { getCurrentUser, isAdmin, isMarket, isVendedor } from '../utils/auth';
import { getAllData, putData, addData, deleteData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';

const denominations = [
  { value: 1000, label: '$1000', image: 'https://via.placeholder.com/60x30/007bff/ffffff?text=1000' },
  { value: 500, label: '$500', image: 'https://via.placeholder.com/60x30/28a745/ffffff?text=500' },
  { value: 200, label: '$200', image: 'https://via.placeholder.com/60x30/ffc107/000000?text=200' },
  { value: 100, label: '$100', image: 'https://via.placeholder.com/60x30/dc3545/ffffff?text=100' },
  { value: 50, label: '$50', image: 'https://via.placeholder.com/60x30/6c757d/ffffff?text=50' },
  { value: 20, label: '$20', image: 'https://via.placeholder.com/60x30/17a2b8/ffffff?text=20' },
  { value: 10, label: '$10', image: 'https://via.placeholder.com/60x30/6f42c1/ffffff?text=10' },
  { value: 5, label: '$5', image: 'https://via.placeholder.com/60x30/fd7e14/ffffff?text=5' },
  { value: 2, label: '$2', image: 'https://via.placeholder.com/60x30/e83e8c/ffffff?text=2' },
  { value: 1, label: '$1', image: 'https://via.placeholder.com/60x30/20c997/ffffff?text=1' },
];

const CashRegisterDashboard = ({ selectedMarket }) => {
  const currentUser = getCurrentUser();
  const [cashRegisterState, setCashRegisterState] = useState(null);
  const [openingAmounts, setOpeningAmounts] = useState({});
  const [closingAmounts, setClosingAmounts] = useState({});
  const [cashMovements, setCashMovements] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const savedCashRegisterState = await getAllData(`cashRegisterState_${currentUser.username}`);
      setCashRegisterState(savedCashRegisterState[0]?.state || null);

      const savedMovements = await getAllData(`cashMovements_${currentUser.username}`);
      setCashMovements(savedMovements);

      const allSales = await getAllData('sales');
      const marketToShow = isAdmin() ? selectedMarket : currentUser.marketId;
      const filteredSales = isAdmin() && selectedMarket ? 
        allSales.filter(s => s.marketId === selectedMarket) : 
        allSales.filter(s => s.marketId === marketToShow);
      setSales(filteredSales);

      if (savedCashRegisterState[0]?.state === 'open') {
        const lastOpening = savedMovements.find(m => m.type === 'opening' && m.status === 'open');
        if (lastOpening) {
          setOpeningAmounts(lastOpening.denominations);
        }
      }
    };
    loadData();
  }, [currentUser.username, selectedMarket]);

  const calculateTotal = (amounts) => {
    return denominations.reduce((sum, denom) => sum + (amounts[denom.value] || 0) * denom.value, 0);
  };

  const handleOpeningChange = (value, count) => {
    setOpeningAmounts(prev => ({ ...prev, [value]: parseInt(count) || 0 }));
  };

  const handleClosingChange = (value, count) => {
    setClosingAmounts(prev => ({ ...prev, [value]: parseInt(count) || 0 }));
  };

  const handleOpenCashRegister = async () => {
    const totalOpening = calculateTotal(openingAmounts);
    const newMovement = {
      id: Date.now(),
      type: 'opening',
      date: new Date().toISOString(),
      user: currentUser.username,
      marketId: currentUser.marketId,
      denominations: openingAmounts,
      total: totalOpening,
      status: 'open'
    };
    const updatedMovements = [...cashMovements, newMovement];
    await addData(`cashMovements_${currentUser.username}`, newMovement);
    await putData(`cashRegisterState_${currentUser.username}`, { id: currentUser.username, state: 'open' });
    setCashMovements(updatedMovements);
    setCashRegisterState('open');
    syncLocalStorageWithIndexedDB(`cashMovements_${currentUser.username}`, updatedMovements);
    syncLocalStorageWithIndexedDB(`cashRegisterState_${currentUser.username}`, [{ id: currentUser.username, state: 'open' }]);
  };

  const handleCloseCashRegister = async () => {
    const totalClosing = calculateTotal(closingAmounts);
    const lastOpening = cashMovements.find(m => m.type === 'opening' && m.status === 'open');
    const totalSalesToday = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const openingDate = new Date(lastOpening.date);
      return saleDate >= openingDate && saleDate <= new Date();
    }).reduce((sum, sale) => sum + sale.total, 0);

    const expectedTotal = lastOpening.total + totalSalesToday;
    const difference = totalClosing - expectedTotal;

    const newMovement = {
      id: Date.now(),
      type: 'closing',
      date: new Date().toISOString(),
      user: currentUser.username,
      marketId: currentUser.marketId,
      denominations: closingAmounts,
      total: totalClosing,
      expectedTotal: expectedTotal,
      difference: difference,
      status: 'closed'
    };
    const updatedMovements = [...cashMovements, newMovement];
    await addData(`cashMovements_${currentUser.username}`, newMovement);
    await putData(`cashRegisterState_${currentUser.username}`, { id: currentUser.username, state: 'closed' });
    setCashMovements(updatedMovements);
    setCashRegisterState('closed');

    // Marcar la apertura anterior como cerrada en IndexedDB
    const updatedOpeningMovement = { ...lastOpening, status: 'closed' };
    await putData(`cashMovements_${currentUser.username}`, updatedOpeningMovement);

    syncLocalStorageWithIndexedDB(`cashMovements_${currentUser.username}`, updatedMovements);
    syncLocalStorageWithIndexedDB(`cashRegisterState_${currentUser.username}`, [{ id: currentUser.username, state: 'closed' }]);
  };

  const renderCashInput = (amounts, handleChangeFn) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {denominations.map(denom => (
        <div key={denom.value} className="flex items-center space-x-2 bg-gray-100 p-2 rounded-md dark:bg-gray-700">
          <img src={denom.image} alt={denom.label} className="w-12 h-auto rounded" />
          <span className="font-medium text-gray-800 dark:text-white">{denom.label}</span>
          <input
            type="number"
            min="0"
            value={amounts[denom.value] || ''}
            onChange={(e) => handleChangeFn(denom.value, e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
      ))}
    </div>
  );

  const lastOpening = cashMovements.find(m => m.type === 'opening' && m.status === 'open');
  const totalOpening = lastOpening ? lastOpening.total : 0;
  const totalSalesToday = sales.filter(sale => {
    if (!lastOpening) return false;
    const saleDate = new Date(sale.date);
    const openingDate = new Date(lastOpening.date);
    return saleDate >= openingDate && saleDate <= new Date();
  }).reduce((sum, sale) => sum + sale.total, 0);
  const expectedTotalAtClose = totalOpening + totalSalesToday;
  const currentClosingTotal = calculateTotal(closingAmounts);
  const currentDifference = currentClosingTotal - expectedTotalAtClose;

  if (!isMarket(currentUser) && !isVendedor(currentUser)) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Gestión de Caja</h2>

      {cashRegisterState === 'open' && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Caja Abierta</h3>
          <p className="text-lg mb-2 text-gray-700 dark:text-gray-300">Total de Apertura: <span className="font-bold">${totalOpening.toFixed(2)}</span></p>
          <p className="text-lg mb-2 text-gray-700 dark:text-gray-300">Ventas del Turno: <span className="font-bold">${totalSalesToday.toFixed(2)}</span></p>
          <p className="text-lg mb-4 text-gray-700 dark:text-gray-300">Total Esperado al Cierre: <span className="font-bold">${expectedTotalAtClose.toFixed(2)}</span></p>

          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">Ingresar Billetes al Cierre</h4>
          {renderCashInput(closingAmounts, handleClosingChange)}
          <p className="text-xl font-bold text-right mt-4 text-gray-800 dark:text-white">Total Contado: ${currentClosingTotal.toFixed(2)}</p>
          <p className={`text-xl font-bold text-right ${currentDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Diferencia: ${currentDifference.toFixed(2)}
          </p>
          <button
            onClick={handleCloseCashRegister}
            className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cerrar Caja
          </button>
        </div>
      )}

      {cashRegisterState === null || cashRegisterState === 'closed' ? (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Abrir Caja</h3>
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">Ingresar Billetes de Apertura</h4>
          {renderCashInput(openingAmounts, handleOpeningChange)}
          <p className="text-xl font-bold text-right mt-4 text-gray-800 dark:text-white">Total de Apertura: ${calculateTotal(openingAmounts).toFixed(2)}</p>
          <button
            onClick={handleOpenCashRegister}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Abrir Caja
          </button>
        </div>
      ) : null}

      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Historial de Movimientos de Caja</h3>
      {cashMovements.length > 0 ? (
        <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Diferencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {cashMovements.map(movement => (
                <tr key={movement.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(movement.date).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{movement.type === 'opening' ? 'Apertura' : 'Cierre'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{movement.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${movement.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {movement.type === 'closing' ? `$${movement.difference.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      movement.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    }`}>
                      {movement.status === 'open' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-300">No hay movimientos de caja registrados.</p>
      )}
    </div>
  );
};

export default CashRegisterDashboard;