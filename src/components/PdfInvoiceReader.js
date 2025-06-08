import React, { useState, useRef } from 'react';

const PdfInvoiceReader = ({ onDataExtracted }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Por favor, selecciona un archivo PDF válido.');
    }
  };

  const extractTextFromPdf = async (pdfFile) => {
    setLoading(true);
    setError('');

    return new Promise(resolve => {
      setTimeout(() => {
        // Datos simulados basados en la imagen de tu factura
        const simulatedData = [
          { id: 1, quantity: 1, description: "JAMON COCIDO", unitPrice: 1000, subtotal: 1000 },
          { id: 2, quantity: 1, description: "QUESO CREMOSO", unitPrice: 1500, subtotal: 1500 },
          { id: 3, quantity: 1, description: "SALAME MILAN", unitPrice: 2000, subtotal: 2000 },
          { id: 4, quantity: 1, description: "PAN DE CAMPO", unitPrice: 500, subtotal: 500 },
          { id: 5, quantity: 1, description: "ACEITUNAS", unitPrice: 300, subtotal: 300 },
          { id: 6, quantity: 1, description: "GASEOSA COCA-COLA", unitPrice: 250, subtotal: 250 },
          { id: 7, quantity: 1, description: "CERVEZA QUILMES", unitPrice: 350, subtotal: 350 },
          { id: 8, quantity: 1, description: "PAPAS FRITAS LAYS", unitPrice: 180, subtotal: 180 },
          { id: 9, quantity: 1, description: "CHOCOLATE AGUIL", unitPrice: 220, subtotal: 220 },
          { id: 10, quantity: 1, description: "GALLETITAS OREO", unitPrice: 120, subtotal: 120 }
        ];

        const validatedData = simulatedData.map(item => {
          const calculatedSubtotal = item.quantity * item.unitPrice;
          const isConsistent = Math.abs(calculatedSubtotal - item.subtotal) < 0.01;
          return { ...item, isConsistent };
        });

        setLoading(false);
        resolve(validatedData);
      }, 2000);
    });
  };

  const handleProcessPdf = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo PDF.');
      return;
    }

    try {
      const extractedData = await extractTextFromPdf(file);
      onDataExtracted(extractedData);
    } catch (err) {
      setError('Error al procesar el PDF. Asegúrate de que sea una factura legible.');
      console.error('PDF processing error:', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Cargar Factura PDF</h3>
      <div className="mb-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {file && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Archivo seleccionado: {file.name}</p>}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      <button
        onClick={handleProcessPdf}
        disabled={!file || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : 'Procesar PDF'}
      </button>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        Nota: Esta es una simulación. La integración real con OCR y PDF parsing
        requiere librerías adicionales y puede ser compleja.
      </p>
    </div>
  );
};

export default PdfInvoiceReader;