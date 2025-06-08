import React from 'react';

const SalesHistory = ({ sales, products }) => {
  if (sales.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-300">No hay ventas registradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg dark:bg-gray-800">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
              Fecha
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
              Cliente
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
              Productos
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
              Total
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
              Pago
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
              Comprobante
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {new Date(sale.date).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(sale.date).toLocaleTimeString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {sale.customerName || 'Consumidor Final'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-white">
                  {sale.items.map(item => item.name).join(', ')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {sale.items.reduce((sum, item) => sum + item.quantity, 0)} unidades
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  ${sale.total.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {sale.paymentMethod === 'cash' && 'Efectivo'}
                  {sale.paymentMethod === 'debit' && 'Débito'}
                  {sale.paymentMethod === 'credit' && 'Crédito'}
                  {sale.paymentMethod === 'mp' && 'Mercado Pago'}
                  {sale.paymentMethod === 'current_account' && 'Cuenta Corriente'}
                  {sale.paymentMethod === 'paid_current_account' && 'Cta. Cte. Pagada'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {sale.invoiceType === 'ticket' && 'Ticket'}
                  {sale.invoiceType === 'A' && 'Factura A'}
                  {sale.invoiceType === 'B' && 'Factura B'}
                  {sale.invoiceType === 'C' && 'Factura C'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesHistory;