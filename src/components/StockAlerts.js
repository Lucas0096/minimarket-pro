import React from 'react';

const StockAlerts = ({ products }) => {
  const lowStockProducts = products.filter(
    product => product.stock <= product.minStock && product.minStock > 0
  );

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const expiredProducts = products.filter(
    product => product.lots && product.lots.some(lot => new Date(lot.expiryDate) <= today && lot.quantity > 0)
  );

  const soonToExpireProducts = products.filter(
    product => product.lots && product.lots.some(lot => new Date(lot.expiryDate) > today && new Date(lot.expiryDate) <= thirtyDaysFromNow && lot.quantity > 0)
  );

  if (lowStockProducts.length === 0 && expiredProducts.length === 0 && soonToExpireProducts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 dark:bg-yellow-800 dark:border-yellow-600 dark:text-yellow-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-100">Productos con bajo stock</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                <ul className="list-disc pl-5 space-y-1">
                  {lowStockProducts.map(product => (
                    <li key={product.id}>
                      {product.name} (Stock: {product.stock}, Mínimo: {product.minStock})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {soonToExpireProducts.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4 dark:bg-orange-800 dark:border-orange-600 dark:text-orange-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400 dark:text-orange-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-100">Productos por vencer (30 días)</h3>
              <div className="mt-2 text-sm text-orange-700 dark:text-orange-200">
                <ul className="list-disc pl-5 space-y-1">
                  {soonToExpireProducts.map(product => (
                    <li key={product.id}>
                      {product.name} (Lotes: {product.lots.filter(lot => new Date(lot.expiryDate) > today && new Date(lot.expiryDate) <= thirtyDaysFromNow && lot.quantity > 0).map(lot => `${lot.quantity}u. vence ${lot.expiryDate}`).join(', ')})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {expiredProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 dark:bg-red-800 dark:border-red-600 dark:text-red-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-100">Productos vencidos</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                <ul className="list-disc pl-5 space-y-1">
                  {expiredProducts.map(product => (
                    <li key={product.id}>
                      {product.name} (Lotes: {product.lots.filter(lot => new Date(lot.expiryDate) <= today && lot.quantity > 0).map(lot => `${lot.quantity}u. vencido el ${lot.expiryDate}`).join(', ')})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;