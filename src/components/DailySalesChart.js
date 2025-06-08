import React from 'react';

const DailySalesChart = ({ sales }) => {
  const getDailySales = () => {
    const dailySales = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString();
      if (!dailySales[date]) {
        dailySales[date] = sale.total;
      } else {
        dailySales[date] += sale.total;
      }
    });

    return Object.entries(dailySales).map(([date, total]) => ({
      date,
      total: parseFloat(total.toFixed(2))
    }));
  };

  const dailyData = getDailySales();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Ventas por Día</h3>
      {dailyData.length > 0 ? (
        <div className="space-y-3">
          {dailyData.map((day, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{day.date}</span>
                <span>${day.total.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (day.total / Math.max(...dailyData.map(d => d.total))) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No hay datos de ventas para mostrar</p>
      )}
    </div>
  );
};

export default DailySalesChart;