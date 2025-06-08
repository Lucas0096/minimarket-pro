const DB_NAME = 'MiniMarketProDB';
const DB_VERSION = 1;
export const STORES = ['products', 'sales', 'users', 'markets', 'suppliers', 'customers', 'cashMovements', 'expenses', 'salesTarget', 'desiredProfit','ReportsDashboard'];

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          if (storeName.startsWith('cashMovements_') || storeName.startsWith('cashRegisterState_')) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          } else {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          }
        }
      });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject('Error opening IndexedDB:', event.target.error);
    };
  });
};

const getObjectStore = async (storeName, mode) => {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const getAllData = async (storeName) => {
  const store = await getObjectStore(storeName, 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const addData = async (storeName, data) => {
  const store = await getObjectStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const putData = async (storeName, data) => {
  const store = await getObjectStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteData = async (storeName, id) => {
  const store = await getObjectStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const clearStore = async (storeName) => {
  const store = await getObjectStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const initializeDBFromLocalStorage = async () => {
  const db = await openDB();
  const transaction = db.transaction(STORES, 'readwrite');

  for (const storeName of STORES) {
    const store = transaction.objectStore(storeName);
    const countRequest = store.count();

    await new Promise((resolve, reject) => {
      countRequest.onsuccess = () => {
        if (countRequest.result === 0) {
          const localStorageData = JSON.parse(localStorage.getItem(storeName)) || [];
          localStorageData.forEach(item => {
            store.add(item);
          });
          console.log(`IndexedDB store '${storeName}' initialized from localStorage.`);
        }
        resolve();
      };
      countRequest.onerror = () => reject(countRequest.error);
    });
  }
  console.log('IndexedDB initialization complete.');
};

export const syncLocalStorageWithIndexedDB = async (storeName, data) => {
  try {
    localStorage.setItem(storeName, JSON.stringify(data)); 
    console.log(`LocalStorage for '${storeName}' synchronized.`);
  } catch (error) {
    console.error(`Error syncing ${storeName}:`, error);
  }
};

export const syncWithBackend = async () => {
  console.log('Sincronizando con backend...');
  for (const storeName of STORES) {
    const localData = await getAllData(storeName);
    if (localData.length > 0) {
      console.log(`Enviando ${storeName} a backend:`, localData);
      // Aquí iría la lógica real para enviar datos al backend
    }
  }
  console.log('Sincronización con backend completada.');
};
