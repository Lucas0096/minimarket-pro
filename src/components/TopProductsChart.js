import React from 'react';

const TopProductsChart = ({ topProducts }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Productos más vendidos</h3>
      {topProducts.length > 0 ? (
        <div className="space-y-3">
          {topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center">
              <div className="w-8 text-sm font-medium text-gray-500">{index + 1}</div>
              <div className="flex-1 ml-2">
                <div className="text-sm font-medium">{product.name}</div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(product.quantity / topProducts[0].quantity) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="ml-2 text-sm font-medium">
                {product.quantity} un. (${product.revenue.toFixed(2)})
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No hay datos de productos para mostrar</p>
      )}
    </div>
  );
};

export default TopProductsChart;