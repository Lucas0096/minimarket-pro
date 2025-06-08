import React, { useState, useEffect } from 'react';
import { isAdmin, isMarket, isVendedor } from '../utils/auth';
import HelpModal from './HelpModal';

const Navbar = ({ currentView, setCurrentView, isOnline, currentUser, deviceType, onLogout }) => {
  const [showStockMenu, setShowStockMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', !isDarkMode);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const buttonBaseClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center";
  const activeClasses = "bg-blue-100 text-blue-800";
  const inactiveClasses = "text-gray-700 hover:bg-gray-100";

  return (
    <nav className="bg-white shadow-lg dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-800 dark:text-white">MiniMarket Pro</span>
            {currentUser && (
              <span className="ml-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                {currentUser.username} ({currentUser.role})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Botón de Modo Día/Noche */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M3 12h1m15.325-4.275l-.707-.707M4.343 19.657l-.707-.707M19.657 4.343l-.707-.707M4.343 4.343l-.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Ventas (para todos) */}
            <button
              onClick={() => setCurrentView('sales')}
              className={`${buttonBaseClasses} ${currentView === 'sales' ? activeClasses : inactiveClasses} dark:text-gray-300 dark:hover:bg-gray-700`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.35 13 5.25 13h13.5c.138 0 .248-.113.266-.25l.5-2a1 1 0 000-.497l-1.45-5.804A1 1 0 0017 3H6.293l-.7-1.707A1 1 0 004.999 1H3zM14 15a1 1 0 110 2 1 1 0 010-2zm-4 0a1 1 0 110 2 1 1 0 010-2zm-9 1a1 1 0 110 2 1 1 0 010-2z" />
              </svg>
              <span className="hidden sm:block">Ventas</span>
            </button>
            
            {/* Menú Stock (Productos, Pedidos, Proveedores) - Solo para Admin y Market */}
            {(!isVendedor(currentUser) || isAdmin(currentUser) || isMarket(currentUser)) && (
              <div className="relative">
                <button
                  onClick={() => setShowStockMenu(!showStockMenu)}
                  className={`${buttonBaseClasses} ${showStockMenu ? activeClasses : inactiveClasses} dark:text-gray-300 dark:hover:bg-gray-700`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 7a2 2 0 00-2-2h2a2 2 0 002 2v2a2 2 0 00-2-2h-2z" />
                  </svg>
                  <span className="hidden sm:block">Stock</span>
                  <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {showStockMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 dark:bg-gray-700">
                    <button
                      onClick={() => { setCurrentView('products'); setShowStockMenu(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Productos
                    </button>
                    <button
                      onClick={() => { setCurrentView('orders'); setShowStockMenu(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Pedidos
                    </button>
                    <button
                      onClick={() => { setCurrentView('suppliers'); setShowStockMenu(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Proveedores
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Ventas Web (para Admin y Market) */}
            {(isAdmin(currentUser) || isMarket(currentUser)) && (
              <button
                onClick={() => setCurrentView('webSales')}
                className={`${buttonBaseClasses} ${currentView === 'webSales' ? activeClasses : inactiveClasses} dark:text-gray-300 dark:hover:bg-gray-700`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:block">Ventas Web</span>
              </button>
            )}

            {/* Calculadora (para Admin y Market) */}
            {(isAdmin(currentUser) || isMarket(currentUser)) && (
              <button
                onClick={() => setCurrentView('markupCalculator')}
                className={`${buttonBaseClasses} ${currentView === 'markupCalculator' ? activeClasses : inactiveClasses} dark:text-gray-300 dark:hover:bg-gray-700`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:block">Calculadora</span>
              </button>
            )}

            {/* Reportes (para todos) */}
            <button
              onClick={() => setCurrentView('reports')}
              className={`${buttonBaseClasses} ${currentView === 'reports' ? activeClasses : inactiveClasses} dark:text-gray-300 dark:hover:bg-gray-700`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span className="hidden sm:block">Reportes</span>
            </button>

            {/* Caja (para Market y Vendedor) */}
            {(isMarket(currentUser) || isVendedor(currentUser)) && (
              <button
                onClick={() => setCurrentView('cashRegister')}
                className={`${buttonBaseClasses} ${currentView === 'cashRegister' ? activeClasses : inactiveClasses} dark:text-gray-300 dark:hover:bg-gray-700`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 002-2V4H4zm10 10H4v2a2 2 0 002 2h8a2 2 0 002-2v-2z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:block">Caja</span>
              </button>
            )}

            {/* Cuentas Corrientes (para Admin y Market) */}
            {(isAdmin(currentUser) || isMarket(currentUser)) && (
              <button
                onClick={() => setCurrentView('currentAccounts')}
                className={`${buttonBaseClasses} ${currentView === 'currentAccounts' ? activeClasses : inactiveClasses} dark:text-gray-300 dark:hover:bg-gray-700`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9.875A.75.75 0 0017.25 9h-4.5a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:block">Cuentas</span>
              </button>
            )}
            
            {/* Menú Ajustes (Mercados, Backup, Usuarios, Ayuda) - Solo para Admin */}
            {isAdmin(currentUser) && (
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className={`${buttonBaseClasses} ${showSettingsMenu ? activeClasses : inactiveClasses} dark:text-gray-300 dark:hover:bg-gray-700`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.325-1.119-1.353-1.9-2.5-1.9s-2.175.781-2.5 1.9c-.291 1.05-.954 1.985-2.02 2.347A.75.75 0 004.5 6.5h11a.75.75 0 00.52-1.323c-1.066-.362-1.729-1.297-2.02-2.347zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M4.5 15.5a.75.75 0 00-.52 1.323c1.066.362 1.729 1.297 2.02 2.347.325 1.119 1.353 1.9 2.5 1.9s2.175-.781 2.5-1.9c.291-1.05.954-1.985 2.02-2.347A.75.75 0 0015.5 15.5h-11z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:block">Ajustes</span>
                  <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 dark:bg-gray-700">
                    <button
                      onClick={() => { setCurrentView('markets'); setShowSettingsMenu(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Mercados
                    </button>
                    <button
                      onClick={() => { setCurrentView('backupRestore'); setShowSettingsMenu(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Backup
                    </button>
                    <button
                      onClick={() => { setCurrentView('userManagement'); setShowSettingsMenu(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Usuarios
                    </button>
                    <button
                      onClick={() => { setShowHelpModal(true); setShowSettingsMenu(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Ayuda
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Estado En línea/Offline */}
            <span className={`px-3 py-2 text-sm font-medium rounded-md ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} hidden sm:block`}>
              {isOnline ? 'En línea' : 'Offline'}
            </span>
            
            {/* Botón Salir */}
            <button
              onClick={onLogout}
              className={`${buttonBaseClasses} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </div>
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </nav>
  );
};

export default Navbar;