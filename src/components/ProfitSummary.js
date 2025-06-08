import React from 'react';

const ProfitSummary = ({ sales, products }) => {
  const calculateSummary = () => {
    const summary = {
      totalSales: 0,
      totalTax: 0,
      totalSubtotal: 0,
      totalProfit: 0,
      totalCost: 0
    };

    if (sales.length === 0 || products.length === 0) {
      return summary;
    }

    sales.forEach(sale => {
      summary.totalSales += sale.total;
      summary.totalTax += sale.tax;
      summary.totalSubtotal += sale.subtotal;

      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          summary.totalCost += product.cost * item.quantity;
        }
      });
    });

    summary.totalProfit = summary.totalSubtotal - summary.totalCost;

    // Redondear valores
    summary.totalSales = parseFloat(summary.totalSales.toFixed(2));
    summary.totalTax = parseFloat(summary.totalTax.toFixed(2));
    summary.totalSubtotal = parseFloat(summary.totalSubtotal.toFixed(2));
    summary.totalCost = parseFloat(summary.totalCost.toFixed(2));
    summary.totalProfit = parseFloat(summary.totalProfit.toFixed(2));

    return summary;
  };

  const summary = calculateSummary();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Ventas Totales</h4>
        <p className="text-2xl font-bold text-blue-600">${summary.totalSales}</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <h4 className="text-sm font-medium text-purple-800 mb-1">Impuestos (21%)</h4>
        <p className="text-2xl font-bold text-purple-600">${summary.totalTax}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <h4 className="text-sm font-medium text-green-800 mb-1">Ganancias</h4>
        <p className="text-2xl font-bold text-green-600">${summary.totalProfit}</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
        <h4 className="text-sm font-medium text-red-800 mb-1">Costos</h4>
        <p className="text-2xl font-bold text-red-600">${summary.totalCost}</p>
      </div>
    </div>
  );
};

export default ProfitSummary;

// DONE