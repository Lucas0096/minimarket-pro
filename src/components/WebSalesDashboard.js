import React, { useState, useEffect } from 'react';
import { getAllData, putData, addData, deleteData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';
import { getCurrentMarket, isAdmin, isMarket } from '../utils/auth';

const WebSalesDashboard = ({ selectedMarket }) => {
  const [products, setProducts] = useState([]);
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneTime, setNewZoneTime] = useState('');
  const [newZonePrice, setNewZonePrice] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const allProducts = await getAllData('products');
      const allOrders = await getAllData('onlineOrders');
      const allZones = await getAllData('deliveryZones');

      const marketToShow = isAdmin() ? selectedMarket : getCurrentMarket();
      const filteredProducts = isAdmin() && selectedMarket ? 
        allProducts.filter(p => p.marketId === selectedMarket) : 
        allProducts.filter(p => p.marketId === marketToShow);
      
      const filteredOrders = isAdmin() && selectedMarket ? 
        allOrders.filter(o => o.marketId === selectedMarket) : 
        allOrders.filter(o => o.marketId === marketToShow);

      const filteredZones = isAdmin() && selectedMarket ? 
        allZones.filter(z => z.marketId === selectedMarket) : 
        allZones.filter(z => z.marketId === marketToShow);

      setProducts(filteredProducts);
      setOnlineOrders(filteredOrders);
      setDeliveryZones(filteredZones);
    };
    loadData();
  }, [selectedMarket]);

  const handleAddZone = async () => {
    if (!newZoneName || !newZoneTime || newZonePrice < 0) return;
    const marketId = isAdmin() ? selectedMarket : getCurrentMarket();
    const newZone = {
      id: Date.now(),
      name: newZoneName,
      estimatedTime: newZoneTime,
      price: newZonePrice,
      marketId
    };
    const updatedZones = [...deliveryZones, newZone];
    await addData('deliveryZones', newZone);
    setDeliveryZones(updatedZones);
    syncLocalStorageWithIndexedDB('deliveryZones', updatedZones);
    setNewZoneName('');
    setNewZoneTime('');
    setNewZonePrice(0);
  };

  const handleDeleteZone = async (id) => {
    await deleteData('deliveryZones', id);
    const updatedZones = deliveryZones.filter(z => z.id !== id);
    setDeliveryZones(updatedZones);
    syncLocalStorageWithIndexedDB('deliveryZones', updatedZones);
  };

  const handleProcessOrder = async (orderId) => {
    const orderToProcess = onlineOrders.find(o => o.id === orderId);
    if (orderToProcess) {
      const updatedOrder = { ...orderToProcess, status: 'Procesado', processedAt: new Date().toISOString() };
      await putData('onlineOrders', updatedOrder);
      const updatedOrders = onlineOrders.map(o => o.id === orderId ? updatedOrder : o);
      setOnlineOrders(updatedOrders);
      syncLocalStorageWithIndexedDB('onlineOrders', updatedOrders);
      alert(`Pedido ${orderId} procesado.`);
    }
  };

  const handleRejectOrder = async (orderId) => {
    const orderToReject = onlineOrders.find(o => o.id === orderId);
    if (orderToReject) {
      const updatedOrder = { ...orderToReject, status: 'Rechazado', rejectedAt: new Date().toISOString() };
      await putData('onlineOrders', updatedOrder);
      const updatedOrders = onlineOrders.map(o => o.id === orderId ? updatedOrder : o);
      setOnlineOrders(updatedOrders);
      syncLocalStorageWithIndexedDB('onlineOrders', updatedOrders);
      alert(`Pedido ${orderId} rechazado.`);
    }
  };

  if (!isAdmin() && !isMarket()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Ventas por Web (Pedidos Online)</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Gestión de Zonas de Reparto</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nombre de la zona (Ej: Centro)"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <input
            type="text"
            placeholder="Tiempo estimado (Ej: 30-45 min)"
            value={newZoneTime}
            onChange={(e) => setNewZoneTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <input
            type="number"
            placeholder="Costo de envío ($)"
            value={newZonePrice}
            onChange={(e) => setNewZonePrice(parseFloat(e.target.value) || 0)}
            className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={handleAddZone}
            className="md:col-span-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Agregar Zona de Reparto
          </button>
        </div>
        {deliveryZones.length > 0 ? (
          <ul className="space-y-2">
            {deliveryZones.map(zone => (
              <li key={zone.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md dark:bg-gray-700 dark:text-gray-300">
                <span>{zone.name} - {zone.estimatedTime} - ${zone.price.toFixed(2)}</span>
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-300">No hay zonas de reparto configuradas.</p>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Pedidos Online Recibidos</h3>
        {onlineOrders.length > 0 ? (
          <div className="space-y-4">
            {onlineOrders.map(order => (
              <div key={order.id} className="bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-lg text-gray-800 dark:text-white">Pedido #{order.id} - {new Date(order.date).toLocaleString()}</h4>
                  <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'Procesado' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300"><strong>Cliente:</strong> {order.customerName}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Dirección:</strong> {order.deliveryAddress}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Zona:</strong> {deliveryZones.find(z => z.id === order.deliveryZoneId)?.name || 'N/A'}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>Método de Pago:</strong> {order.paymentMethod}</p>
                <p className="font-medium mt-2 text-gray-700 dark:text-gray-300">Productos:</p>
                <ul className="list-disc list-inside text-sm ml-4 text-gray-700 dark:text-gray-300">
                  {order.items.map((item, idx) => (
                    <li key={idx}>{item.name} x {item.quantity} (${item.subtotal.toFixed(2)})</li>
                  ))}
                </ul>
                {order.status === 'Pendiente' && (
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleProcessOrder(order.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Procesar Pedido
                    </button>
                    <button
                      onClick={() => handleRejectOrder(order.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Rechazar Pedido
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-300">No hay pedidos online pendientes.</p>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-lg dark:bg-blue-800 dark:border-blue-600 dark:text-blue-100">
        <p className="font-bold">Nota sobre la Página Web Pública:</p>
        <p className="text-sm">
          La implementación de una "Página web pública" y su integración con pasarelas de pago (Mercado Pago),
          moto-mandados o PedidosYa, así como las notificaciones en tiempo real,
          requieren un backend robusto y APIs externas. Este dashboard gestiona
          la visualización y procesamiento de los pedidos que hipotéticamente
          llegarían desde esa página web externa.
        </p>
      </div>
    </div>
  );
};

export default WebSalesDashboard;