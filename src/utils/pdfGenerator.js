const generateSalesReport = (sales, topProducts, timeRange) => {
  // Calcular totales por método de pago
  const paymentMethods = {
    cash: { label: 'Efectivo', total: 0, count: 0 },
    debit: { label: 'Débito', total: 0, count: 0 },
    credit: { label: 'Crédito', total: 0, count: 0 },
    mp: { label: 'Mercado Pago', total: 0, count: 0 },
    current_account: { label: 'Cuenta Corriente', total: 0, count: 0 },
    paid_current_account: { label: 'Cta. Cte. Pagada', total: 0, count: 0 }
  };

  sales.forEach(sale => {
    paymentMethods[sale.paymentMethod].total += sale.total;
    paymentMethods[sale.paymentMethod].count += 1;
  });

  // Generar ventana flotante con el "PDF" (simulado)
  const pdfWindow = window.open('', '_blank');
  
  // Crear contenido del PDF simulado
  const title = `Reporte de Ventas ${
    timeRange === 'day' ? 'Diario' : 
    timeRange === 'week' ? 'Semanal' : 
    timeRange === 'month' ? 'Mensual' : 'Anual'
  }`;
  
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  
  const dateRange = timeRange === 'day' ? 
    `Fecha: ${new Date().toLocaleDateString()}` : 
    `Desde: ${new Date(
      timeRange === 'week' ? new Date().setDate(new Date().getDate() - 7) :
      timeRange === 'month' ? new Date().setMonth(new Date().getMonth() - 1) :
      new Date().setFullYear(new Date().getFullYear() - 1)
    ).toLocaleDateString()} - Hasta: ${new Date().toLocaleDateString()}`;
  
  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .payment-methods { margin: 20px 0; }
        .payment-method { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .payment-total { font-weight: bold; border-top: 2px solid #333; padding-top: 8px; }
        .top-products { margin-top: 30px; }
        .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>MiniMarket Pro - CRM para Minimercados</p>
        <p>${dateRange}</p>
      </div>
      
      <div class="summary">
        <h2>Resumen General</h2>
        <p><strong>Ventas Totales:</strong> ${sales.length}</p>
        <p><strong>Productos Vendidos:</strong> ${totalItems} unidades</p>
        <p><strong>Monto Total:</strong> $${totalSales.toFixed(2)}</p>
      </div>
      
      <div class="payment-methods">
        <h2>Medios de Pago</h2>
        ${Object.values(paymentMethods).map(method => `
          <div class="payment-method">
            <span>${method.label}:</span>
            <span>${method.count} ventas - $${method.total.toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="payment-method payment-total">
          <span>TOTAL:</span>
          <span>$${totalSales.toFixed(2)}</span>
        </div>
      </div>
      
      <h2>Ventas Detalladas</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Productos</th>
            <th>Cantidad</th>
            <th>Total</th>
            <th>Método Pago</th>
            <th>Comprobante</th>
          </tr>
        </thead>
        <tbody>
          ${sales.map(sale => `
            <tr>
              <td>${new Date(sale.date).toLocaleDateString()}</td>
              <td>${sale.customerName || 'Consumidor Final'}</td>
              <td>${sale.items.map(item => item.name).join(', ')}</td>
              <td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td>$${sale.total.toFixed(2)}</td>
              <td>${
                sale.paymentMethod === 'cash' ? 'Efectivo' : 
                sale.paymentMethod === 'debit' ? 'Débito' : 
                sale.paymentMethod === 'credit' ? 'Crédito' : 
                sale.paymentMethod === 'mp' ? 'Mercado Pago' : 
                sale.paymentMethod === 'current_account' ? 'Cuenta Corriente' : 'Cta. Cte. Pagada'
              }</td>
              <td>${
                sale.invoiceType === 'ticket' ? 'Ticket' : 
                sale.invoiceType === 'A' ? 'Factura A' : 
                sale.invoiceType === 'B' ? 'Factura B' : 'Factura C'
              }</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="top-products">
        <h2>Productos más vendidos</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Ventas ($)</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts.map(product => `
              <tr>
                <td>${product.name}</td>
                <td>${product.quantity} unidades</td>
                <td>$${product.revenue.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>Generado el ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  pdfWindow.document.write(content);
  pdfWindow.document.close();
};

const generateCashRegisterReport = (cashMovements, timeRange) => {
  const pdfWindow = window.open('', '_blank');
  
  const title = `Reporte de Caja ${
    timeRange === 'day' ? 'Diario' : 
    timeRange === 'week' ? 'Semanal' : 
    timeRange === 'month' ? 'Mensual' : 'Anual'
  }`;

  const filteredMovements = cashMovements.filter(m => {
    const moveDate = new Date(m.date);
    const now = new Date();
    if (timeRange === 'day') {
      return moveDate.toDateString() === now.toDateString();
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return moveDate >= weekAgo;
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return moveDate >= monthAgo;
    } else if (timeRange === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return moveDate >= yearAgo;
    }
    return true; // 'all'
  });

  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>MiniMarket Pro - CRM para Minimercados</p>
        <p>Generado el ${new Date().toLocaleString()}</p>
      </div>
      
      <h2>Movimientos de Caja</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Usuario</th>
            <th>Total</th>
            <th>Esperado</th>
            <th>Diferencia</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${filteredMovements.map(m => `
            <tr>
              <td>${new Date(m.date).toLocaleString()}</td>
              <td>${m.type === 'opening' ? 'Apertura' : 'Cierre'}</td>
              <td>${m.user}</td>
              <td>$${m.total.toFixed(2)}</td>
              <td>${m.expectedTotal ? `$${m.expectedTotal.toFixed(2)}` : '-'}</td>
              <td>${m.difference ? `$${m.difference.toFixed(2)}` : '-'}</td>
              <td>${m.status === 'open' ? 'Abierta' : 'Cerrada'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Generado el ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  pdfWindow.document.write(content);
  pdfWindow.document.close();
};

const generateCurrentAccountReport = (customers, timeRange) => {
  const pdfWindow = window.open('', '_blank');
  
  const title = `Reporte de Cuentas Corrientes ${
    timeRange === 'day' ? 'Diario' : 
    timeRange === 'week' ? 'Semanal' : 
    timeRange === 'month' ? 'Mensual' : 'Anual'
  }`;

  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>MiniMarket Pro - CRM para Minimercados</p>
        <p>Generado el ${new Date().toLocaleString()}</p>
      </div>
      
      <h2>Clientes con Deuda</h2>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>DNI</th>
            <th>Teléfono</th>
            <th>Deuda Total</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(c => `
            <tr>
              <td>${c.name} ${c.lastName || ''}</td>
              <td>${c.dni || '-'}</td>
              <td>${c.phone || '-'}</td>
              <td>$${c.totalDebt.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Generado el ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  pdfWindow.document.write(content);
  pdfWindow.document.close();
};

export { generateSalesReport, generateCashRegisterReport, generateCurrentAccountReport };