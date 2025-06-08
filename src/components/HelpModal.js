import React from 'react';

const HelpModal = ({ onClose }) => {
  const handleEmailClick = () => {
    window.open('mailto:soporte@minimarketpro.com?subject=Reporte%20de%20Error%20MiniMarket%20Pro', '_blank');
    onClose();
  };

  const handleWhatsappClick = () => {
    // Reemplaza '54911...' con el número de WhatsApp de soporte (incluyendo código de país sin +)
    window.open('https://wa.me/5491155551234?text=Hola,%20necesito%20ayuda%20con%20MiniMarket%20Pro.', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">¿Necesitas Ayuda?</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-700 mb-6 text-center">Elige cómo quieres contactar a soporte:</p>

        <div className="space-y-4">
          <button
            onClick={handleEmailClick}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 4v7a2 2 0 002 2h14a2 2 0 002-2v-7m-18 0h18" />
            </svg>
            Contactar por Email
          </button>
          <button
            onClick={handleWhatsappClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.244-1.076l-4.11 1.15a1 1 0 01-1.223-1.223l1.15-4.11A9.863 9.863 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Contactar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;