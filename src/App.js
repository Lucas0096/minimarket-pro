import React, { useState, useEffect } from 'react';
import ProductsDashboard from './components/ProductsDashboard';
import SalesDashboard from './components/SalesDashboard';
import ReportsDashboard from './components/ReportsDashboard';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import MarketsAdmin from './components/MarketsAdmin';
import CashRegisterDashboard from './components/CashRegisterDashboard';
import CurrentAccountsDashboard from './components/CurrentAccountsDashboard';
import OrdersDashboard from './components/OrdersDashboard';
import SuppliersDashboard from './components/SuppliersDashboard';
import MarkupCalculatorDashboard from './components/MarkupCalculatorDashboard';
import BackupRestoreDashboard from './components/BackupRestoreDashboard';
import WebSalesDashboard from './components/WebSalesDashboard';
import MarketSelectionModal from './components/MarketSelectionModal';
import UserManagementDashboard from './components/UserManagementDashboard';
import { getCurrentUser, logoutUser, isAdmin } from './utils/auth';
import { checkAndNotify } from './utils/bot';
import { initializeDBFromLocalStorage, syncWithBackend } from './utils/indexedDb';

// Función para detectar el tipo de dispositivo
const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  // Expresión regular completa para detectar dispositivos móviles
  const isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|rim)|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(d|ex)|ny(g|mo)|ap(ad|im)|aq(t|u2|x3)|as(te|us)|attw|au(t|v )|aimu|aver|bi(lg|si)|br(ez|r )|bu(ck|n )|bx(id|r )|c55\/|capi|ccwa|cdm\-|cell|chtm|cl(ad|uk)|co(mp|nd)|craw|da(is|eo)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(at|te)|ew(ic|id)|fg(lo|sz)|fly(?:\-|_)|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c|ti)|hu(aw|tc)|i\-mo|ipaq|ipon|iq(at|dv|lc)|iris|jack|jimi|kddi|kgt|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50t|\-m|-v|490|500)|leno|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|ad|ti)|mt(p1|wv)|ne(ad|nv|on|un)|ng(01|j |m )|nl(al|dn)|nokia( ru)?|nn(02|v )|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-x|r )|phil|pire|pl(ay|uc)|pn\-be|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-m|\-r|f5)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|pn|to|sh)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|un|us)|sh(mo|ow)|si(em|v )|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(us|v )|sy(01|mb)|t2(mo|v )|tdg\-|tel(i|m)|tim\-|t\-mo|tk(a|x)|tor(m|pt)|tr(ad|h )|ts(70|m\-|p[ad])|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]0|\-v)|vm40|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4));

  if (isMobile) {
    return 'mobile';
  }
  // Detección de tablet más específica (ej. iPad, Android tablets)
  if (/(ipad|tablet|android(?!.*mobile))/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
};

const App = () => {
  const [currentView, setCurrentView] = useState('products');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showMarketSelection, setShowMarketSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const initApp = async () => {
      await initializeDBFromLocalStorage();
      const user = getCurrentUser();
      setCurrentUser(user);

      if (user && isAdmin(user)) {
        setShowMarketSelection(true);
      }
      setIsLoading(false);
    };

    initApp();

    const handleOnline = () => {
      setIsOnline(true);
      syncWithBackend();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setDeviceType(getDeviceType());
    const handleResize = () => setDeviceType(getDeviceType());
    window.addEventListener('resize', handleResize);


    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      checkAndNotify();
      const botInterval = setInterval(checkAndNotify, 1000 * 60 * 60);
      return () => clearInterval(botInterval);
    }
  }, [currentUser]);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setSelectedMarket(null);
    setCurrentView('login');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (isAdmin(user)) {
      setShowMarketSelection(true);
    } else {
      setCurrentView('products');
    }
  };

  const handleMarketSelected = (marketId) => {
    setSelectedMarket(marketId);
    setShowMarketSelection(false);
    setCurrentView('products');
  };

  const renderView = () => {
    if (isLoading) {
      return <div className="text-center py-10 text-lg font-medium dark:text-gray-300">Cargando...</div>;
    }

    if (!currentUser) {
      return <LoginPage onLogin={handleLoginSuccess} />;
    }

    if (isAdmin(currentUser) && !selectedMarket && 
        !['markets', 'backupRestore', 'userManagement'].includes(currentView)) {
      return (
        <div className="text-center py-10">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Por favor, selecciona un mercado para gestionar.</h3>
          <button
            onClick={() => setShowMarketSelection(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Seleccionar Mercado
          </button>
        </div>
      );
    }

    switch(currentView) {
      case 'products': 
        return <ProductsDashboard isOnline={isOnline} selectedMarket={selectedMarket} />;
      case 'sales': 
        return <SalesDashboard isOnline={isOnline} selectedMarket={selectedMarket} />;
      case 'reports': 
        return <ReportsDashboard selectedMarket={selectedMarket} />;
      case 'markets': 
        return <MarketsAdmin onSelectMarket={setSelectedMarket} />;
      case 'cashRegister': 
        return <CashRegisterDashboard selectedMarket={selectedMarket} />;
      case 'currentAccounts': 
        return <CurrentAccountsDashboard selectedMarket={selectedMarket} />;
      case 'orders': 
        return <OrdersDashboard selectedMarket={selectedMarket} />;
      case 'suppliers': 
        return <SuppliersDashboard selectedMarket={selectedMarket} />;
      case 'markupCalculator': 
        return <MarkupCalculatorDashboard selectedMarket={selectedMarket} />;
      case 'webSales': 
        return <WebSalesDashboard selectedMarket={selectedMarket} />;
      case 'backupRestore': 
        return <BackupRestoreDashboard />;
      case 'userManagement': 
        return <UserManagementDashboard />;
      default: 
        return <ProductsDashboard isOnline={isOnline} selectedMarket={selectedMarket} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {currentUser && (
        <Navbar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          isOnline={isOnline}
          currentUser={currentUser}
          deviceType={deviceType}
          onLogout={handleLogout}
        />
      )}
      <main className="container mx-auto px-4 py-8">
        {renderView()}
      </main>
      {showMarketSelection && currentUser && isAdmin(currentUser) && (
        <MarketSelectionModal onSelectMarket={handleMarketSelected} onClose={() => {}} />
      )}
    </div>
  );
};

export default App;