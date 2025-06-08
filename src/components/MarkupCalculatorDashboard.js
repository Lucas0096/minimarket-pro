import React, { useState, useEffect } from 'react';
import { getCurrentMarket, isAdmin, isMarket } from '../utils/auth';
import { getAllData, putData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';

const MarkupCalculatorDashboard = ({ selectedMarket }) => {
  const [expenses, setExpenses] = useState({
    rent: 0,
    employees: 0,
    salaries: 0,
    taxes: 0,
    services: 0,
    other: 0
  });
  const [totalMonthlySales, setTotalMonthlySales] = useState(0);
  const [desiredProfitMargin, setDesiredProfitMargin] = useState(20); // %
  const [calculatedMarkup, setCalculatedMarkup] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
      if (marketId) {
        const savedExpenses = (await getAllData('expenses')).find(e => e.id === marketId) || { id: marketId, marketId: marketId, rent: 0, employees: 0, salaries: 0, taxes: 0, services: 0, other: 0 };
        setExpenses(savedExpenses);

        const savedSalesTarget = (await getAllData('salesTarget')).find(s => s.id === marketId) || { id: marketId, marketId: marketId, value: 0 };
        setTotalMonthlySales(savedSalesTarget.value || 0);

        const savedDesiredProfit = (await getAllData('desiredProfit')).find(d => d.id === marketId) || { id: marketId, marketId: marketId, value: 20 };
        setDesiredProfitMargin(savedDesiredProfit.value || 20);
      }
    };
    loadData();
  }, [selectedMarket]);

  useEffect(() => {
    calculateMarkup();
  }, [expenses, totalMonthlySales, desiredProfitMargin]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const newExpenses = { ...expenses, [name]: parseFloat(value) || 0 };
    setExpenses(newExpenses);
    const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
    await putData('expenses', { ...newExpenses, id: marketId, marketId });
  };

  const handleSalesTargetChange = async (e) => {
    const newValue = parseFloat(e.target.value) || 0;
    setTotalMonthlySales(newValue);
    const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
    await putData('salesTarget', { id: marketId, marketId, value: newValue });
  };

  const handleProfitMarginChange = async (e) => {
    const newValue = parseFloat(e.target.value) || 0;
    setDesiredProfitMargin(newValue);
    const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
    await putData('desiredProfit', { id: marketId, marketId, value: newValue });
  };

  const calculateMarkup = () => {
    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    
    if (totalMonthlySales <= 0) {
      setCalculatedMarkup(0);
      return;
    }

    const totalPercentageNeeded = (totalExpenses / totalMonthlySales * 100) + desiredProfitMargin;
    if (totalPercentageNeeded >= 100) {
      setCalculatedMarkup(Infinity);
      return;
    }
    const calculated = (100 / (100 - totalPercentageNeeded)) - 1;
    setCalculatedMarkup(calculated * 100);
  };

  if (!isAdmin() && !isMarket()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Calculadora de Sobreprecio</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Gastos Fijos Mensuales</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alquiler ($)</label>
              <input type="number" name="rent" value={expenses.rent} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empleados (cantidad)</label>
              <input type="number" name="employees" value={expenses.employees} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sueldos ($)</label>
              <input type="number" name="salaries" value={expenses.salaries} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Impuestos ($)</label>
              <input type="number" name="taxes" value={expenses.taxes} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servicios ($)</label>
              <input type="number" name="services" value={expenses.services} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Otros Gastos ($)</label>
              <input type="number" name="other" value={expenses.other} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
          </div>
          <p className="text-lg font-bold text-right mt-4 text-gray-800 dark:text-white">Total Gastos: ${Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Objetivos y Resultados</h3>
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ventas Mensuales Esperadas ($)</label>
              <input type="number" value={totalMonthlySales} onChange={handleSalesTargetChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Margen de Ganancia Deseado (%)</label>
              <input type="number" value={desiredProfitMargin} onChange={handleProfitMarginChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-md shadow-sm dark:bg-gray-800">
            <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Sobreprecio Sugerido</h4>
            <p className="text-3xl font-bold text-blue-600">
              {calculatedMarkup === Infinity ? 'Imposible con estos datos' : `${calculatedMarkup.toFixed(2)}%`}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Este porcentaje de sobreprecio sobre el costo de tus productos te permitiría cubrir tus gastos fijos y alcanzar tu margen de ganancia deseado, asumiendo las ventas mensuales esperadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkupCalculatorDashboard;