import React, { useState, useEffect } from 'react';
import DailySalesChart from './DailySalesChart';
import TopProductsChart from './TopProductsChart';
import ProfitSummary from './ProfitSummary';
import { generateSalesReport, generateCashRegisterReport, generateCurrentAccountReport } from '../utils/pdfGenerator';
import { isAdmin, getCurrentMarket, isMarket } from '../utils/auth';
import { getAllData } from '../utils/indexedDb';

const ReportsDashboard = ({ selectedMarket }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cashMovements, setCashMovements] = useState([]);
  const [timeRange, setTimeRange] = useState('day');
  const [paymentSummary, setPaymentSummary] = useState({
    cash: 0,
    debit: 0,
    credit: 0,
    transfer: 0,
    mp: 0,
    current_account: 0,
    paid_current_account: 0
  });

  useEffect(() => {
    const loadData = async () => {
      const allSales = await getAllData('sales');
      const allProducts = await getAllData('products');
      const allCustomers = await getAllData('customers');
      const allCashMovements = await getAllData(`cashMovements_${getCurrentMarket()}`);
      
      const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
      const filteredSales = isAdmin() && selectedMarket ? 
        allSales.filter(s => s.marketId === selectedMarket) : 
        allSales.filter(s => s.marketId === marketToShow);
      
      const filteredProducts = isAdmin() && selectedMarket ? 
        allProducts.filter(p => p.marketId === selectedMarket) : 
        allProducts.filter(p => p.marketId === marketToShow);

      const filteredCustomers = isAdmin() && selectedMarket ?
        allCustomers.filter(c => c.marketId === selectedMarket) :
        allCustomers.filter(c => c.marketId === marketToShow);

      const filteredCashMovements = allCashMovements.filter(m => m.marketId === marketToShow);

      // Filtrar ventas por rango de tiempo
      const now = new Date();
      const salesInTimeRange = filteredSales.filter(sale => {
        const saleDate = new Date(sale.date);
        if (timeRange === 'day') {
          return saleDate.toDateString() === now.toDateString();
        } else if (timeRange === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return saleDate >= weekAgo;
        } else if (timeRange === 'month') {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return saleDate >= monthAgo;
        } else if (timeRange === 'year') {
          const yearAgo = new Date(now);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return saleDate >= yearAgo;
        }
        return true; // 'all'
      });

      // Calcular resumen de pagos
      const summary = {
        cash: 0,
        debit: 0,
        credit: 0,
        transfer: 0,
        mp: 0,
        current_account: 0,
        paid_current_account: 0
      };

      salesInTimeRange.forEach(sale => {
        summary[sale.paymentMethod] += sale.total;
      });

      setPaymentSummary(summary);
      setSales(salesInTimeRange);
      setProducts(filteredProducts);
      setCustomers(filteredCustomers);
      setCashMovements(filteredCashMovements);
    };
    loadData();
  }, [selectedMarket, timeRange]);

  const getTopProducts = () => {
    const productSales = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            quantity: 0,
            revenue: 0,
            name: item.name
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const getLoyalCustomers = () => {
    const customerSales = {};
    sales.forEach(sale => {
      if (sale.customerName && sale.customerName !== 'Consumidor Final') {
        if (!customerSales[sale.customerName]) {
          customerSales[sale.customerName] = {
            totalSpent: 0,
            visitCount: 0,
            name: sale.customerName,
            dni: sale.customerDNI
          };
        }
        customerSales[sale.customerName].totalSpent += sale.total;
        customerSales[sale.customerName].visitCount += 1;
      }
    });
    return Object.values(customerSales).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  };

  const handleExportPDF = (reportType) => {
    if (reportType === 'sales') {
      generateSalesReport(sales, getTopProducts(), timeRange);
    } else if (reportType === 'cashRegister') {
      generateCashRegisterReport(cashMovements, timeRange);
    } else if (reportType === 'currentAccounts') {
      const currentAccountCustomers = {};
      sales.forEach(sale => {
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
      generateCurrentAccountReport(Object.values(currentAccountCustomers), timeRange);
    }
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case 'day': return 'Diario';
      case 'week': return 'Semanal';
      case 'month': return 'Mensual';
      case 'year': return 'Anual';
      case 'all': return 'Histórico';
      default: return '';
    }
  };

  if (!isAdmin() && !isMarket()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Reportes y Estadísticas</h2>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Reporte {getTimeRangeLabel()} - {sales.length} ventas registradas
        </h3>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="day">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
            <option value="all">Todos</option>
          </select>
          <div className="relative group">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Exportar PDF
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 dark:bg-gray-700">
              <button onClick={() => handleExportPDF('sales')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600">Reporte de Ventas</button>
              <button onClick={() => handleExportPDF('cashRegister')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600">Cierre de Caja</button>
              <button onClick={() => handleExportPDF('currentAccounts')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600">Cuentas Corrientes</button>
            </div>
          </div>
        </div>
      </div>

      <ProfitSummary sales={sales} products={products} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Resumen de Pagos</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Efectivo:</span>
              <span className="font-medium">${paymentSummary.cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Tarjeta de Débito:</span>
              <span className="font-medium">${paymentSummary.debit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Tarjeta de Crédito:</span>
              <span className="font-medium">${paymentSummary.credit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Mercado Pago:</span>
              <span className="font-medium">${paymentSummary.mp.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Cuenta Corriente:</span>
              <span className="font-medium">${paymentSummary.current_account.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Cta. Cte. Pagada:</span>
              <span className="font-medium">${paymentSummary.paid_current_account.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold dark:border-gray-600 dark:text-white">
              <span>Total:</span>
              <span>${(paymentSummary.cash + paymentSummary.debit + paymentSummary.credit + paymentSummary.mp + paymentSummary.current_account + paymentSummary.paid_current_account).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DailySalesChart sales={sales} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopProductsChart topProducts={getTopProducts()} />
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Clientes Más Fieles</h3>
          {getLoyalCustomers().length > 0 ? (
            <ul className="space-y-2">
              {getLoyalCustomers().map((customer, index) => (
                <li key={index} className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
                  <span>{customer.name} ({customer.visitCount} compras)</span>
                  <span className="font-medium">${customer.totalSpent.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-300">No hay datos de clientes fieles para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;