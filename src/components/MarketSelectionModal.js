import React, { useState, useEffect } from 'react';
import { getAllData, addData } from '../utils/indexedDb';

const MarketSelectionModal = ({ onSelectMarket, onClose }) => {
  const [markets, setMarkets] = useState([]);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [showNewMarketInput, setShowNewMarketInput] = useState(false);
  const [newMarketName, setNewMarketName] = useState('');

  useEffect(() => {
    const loadMarkets = async () => {
      const allMarkets = await getAllData('markets');
      setMarkets(allMarkets);
      if (allMarkets.length > 0) {
        setSelectedMarketId(allMarkets[0].id);
      }
    };
    loadMarkets();
  }, []);

  const handleSelect = () => {
    if (selectedMarketId) {
      onSelectMarket(selectedMarketId);
    } else {
      alert('Por favor, selecciona un mercado.');
    }
  };

  const handleAddMarket = async () => {
    if (!newMarketName.trim()) return;
    await addData('markets', { name: newMarketName });
    const updated = await getAllData('markets');
    setMarkets(updated);
    setSelectedMarketId(updated[updated.length - 1].id);
    setNewMarketName('');
    setShowNewMarketInput(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Selecciona un Mercado</h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Como administrador, debes seleccionar el mercado que deseas gestionar.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <select
            value={selectedMarketId}
            onChange={(e) => setSelectedMarketId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {markets.length === 0 && <option value="">No hay mercados disponibles</option>}
            {markets.map(market => (
              <option key={market.id} value={market.id}>{market.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowNewMarketInput(true)}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
            title="Agregar nuevo mercado"
          >
            <span className="text-xl font-bold leading-none">+</span>
          </button>
        </div>

        {showNewMarketInput && (
          <div className="space-y-2 mb-4">
            <input
              type="text"
              value={newMarketName}
              onChange={(e) => setNewMarketName(e.target.value)}
              placeholder="Nombre del nuevo mercado"
              className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewMarketInput(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddMarket}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleSelect}
          disabled={!selectedMarketId}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${selectedMarketId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300'}`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default MarketSelectionModal;