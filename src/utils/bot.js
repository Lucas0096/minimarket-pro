import { getCurrentUser } from './auth';

const checkAndNotify = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  // Recordatorio de Apertura/Cierre de Caja
  const cashRegisterState = JSON.parse(localStorage.getItem(`cashRegisterState_${currentUser.username}`));
  if (cashRegisterState === null || cashRegisterState === 'closed') {
    console.log(`[BOT] ${currentUser.username}: ¡Recuerda abrir la caja para tu turno!`);
    // alert(`[BOT] ${currentUser.username}: ¡Recuerda abrir la caja para tu turno!`); // Para demostración
  } else if (cashRegisterState === 'open') {
    const lastOpening = JSON.parse(localStorage.getItem(`cashMovements_${currentUser.username}`))
      .find(m => m.type === 'opening' && m.status === 'open');
    const now = new Date();
    const openingTime = new Date(lastOpening.date);
    const hoursSinceOpening = (now - openingTime) / (1000 * 60 * 60);

    if (hoursSinceOpening > 8) { // Si la caja lleva abierta más de 8 horas
      console.log(`[BOT] ${currentUser.username}: ¡Tu turno está por terminar! Recuerda cerrar la caja.`);
      // alert(`[BOT] ${currentUser.username}: ¡Tu turno está por terminar! Recuerda cerrar la caja.`); // Para demostración
    }
  }

  // Notificación de Cuentas por Cobrar (solo para Admin y Market)
  if (currentUser.role === 'admin' || currentUser.role === 'market') {
    const allSales = JSON.parse(localStorage.getItem('sales')) || [];
    const marketId = currentUser.marketId || null; // Admin puede ver todos, Market solo el suyo

    const currentAccountSales = allSales.filter(sale => 
      sale.paymentMethod === 'current_account' && 
      (marketId === null || sale.marketId === marketId)
    );

    const customersWithDebt = {};
    currentAccountSales.forEach(sale => {
      if (!customersWithDebt[sale.customerName]) {
        customersWithDebt[sale.customerName] = {
          name: sale.customerName,
          totalDebt: 0,
          phone: sale.customerPhone // Asumiendo que el teléfono se guarda en la venta
        };
      }
      customersWithDebt[sale.customerName].totalDebt += sale.total;
    });

    Object.values(customersWithDebt).forEach(customer => {
      if (customer.totalDebt > 0) {
        console.log(`[BOT] ${currentUser.username}: ¡Recordatorio! El cliente ${customer.name} debe $${customer.totalDebt.toFixed(2)}.`);
        // alert(`[BOT] ${currentUser.username}: ¡Recordatorio! El cliente ${customer.name} debe $${customer.totalDebt.toFixed(2)}.`); // Para demostración
        // Aquí se integraría con Twilio/Zenvia si se tuviera la API
      }
    });
  }
};

// Ejecutar el bot cada cierto tiempo (ej. cada hora)
// setInterval(checkAndNotify, 1000 * 60 * 60); // Cada hora
// Para demostración, se puede ejecutar más seguido o al cargar la app
// checkAndNotify(); // Ejecutar al inicio

export { checkAndNotify };