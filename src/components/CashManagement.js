npm startimport React, { useState } from "react";

const DENOMINATIONS = [
  1000, 500, 200, 100, 50, 20, 10, 5, 2, 1
];

const CashManagement = () => {
  const [counts, setCounts] = useState(
    DENOMINATIONS.reduce((acc, denom) => ({ ...acc, [denom]: "" }), {})
  );
  const [history, setHistory] = useState([]);

  const handleChange = (denom, value) => {
    if (/^\d*$/.test(value)) {
      setCounts((prev) => ({ ...prev, [denom]: value }));
    }
  };

  const total = DENOMINATIONS.reduce(
    (sum, denom) => sum + (parseInt(counts[denom] || 0, 10) * denom),
    0
  );

  const handleOpenCash = () => {
    if (total > 0) {
      setHistory([
        { date: new Date().toLocaleString(), total, breakdown: { ...counts } },
        ...history,
      ]);
      setCounts(DENOMINATIONS.reduce((acc, denom) => ({ ...acc, [denom]: "" }), {}));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Gestión de Efectivo</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {DENOMINATIONS.map((denom) => (
          <div key={denom} className="flex flex-col items-center">
            <label className="font-semibold mb-1">${denom}</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={counts[denom]}
              onChange={(e) => handleChange(denom, e.target.value)}
              min="0"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-medium">Total de apertura:</span>
        <span className="text-2xl font-bold text-green-600">${total.toLocaleString()}</span>
      </div>
      <button
        className={`w-full py-2 rounded text-white font-semibold transition-colors ${
          total > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
        }`}
        onClick={handleOpenCash}
        disabled={total === 0}
      >
        Abrir caja
      </button>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Historial de aperturas</h3>
        {history.length === 0 ? (
          <p className="text-gray-500">No hay aperturas registradas.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {history.map((entry, idx) => (
              <li key={idx} className="py-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{entry.date}</span>
                  <span className="font-bold text-green-700">${entry.total.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2">
                  {DENOMINATIONS.map((denom) =>
                    entry.breakdown[denom] && parseInt(entry.breakdown[denom], 10) > 0 ? (
                      <span key={denom}>
                        {entry.breakdown[denom]} x ${denom}
                      </span>
                    ) : null
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CashManagement; 