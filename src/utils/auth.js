import { getAllData, putData, addData, syncLocalStorageWithIndexedDB } from './indexedDb';

export const authenticateUser = async (username, password) => {
  // Definir usuarios predefinidos
  const predefinedUsers = [
    { id: 'admin', username: 'admin', password: 'admin', role: 'admin', marketId: null },
    { id: 'lucas', username: 'lucas', password: 'lucas', role: 'admin', marketId: null },
    { id: 'market1', username: 'market1', password: 'market1', role: 'market', marketId: 'market1' },
    { id: 'vendedor', username: 'vendedor', password: 'vendedor', role: 'vendedor', marketId: 'market1' }
  ];

  // Asegurarse de que los usuarios predefinidos existan en IndexedDB
  // y que sus datos estén actualizados (especialmente el rol)
  for (const user of predefinedUsers) {
    const existingUser = (await getAllData('users')).find(u => u.id === user.id);
    if (!existingUser) {
      await addData('users', user);
    } else {
      // Actualizar si hay cambios en los datos predefinidos (ej. rol, password)
      await putData('users', user);
    }
  }
  // Sincronizar localStorage con la versión más reciente de usuarios de IndexedDB
  // Esto es crucial para que `getCurrentUser` tenga la información correcta inmediatamente
  await syncLocalStorageWithIndexedDB('users', await getAllData('users'));

  // Buscar en todos los usuarios (predefinidos y creados por admin) en IndexedDB
  const allUsers = await getAllData('users');
  const user = allUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Guardar el usuario actual en localStorage
    localStorage.setItem('currentUser', JSON.stringify({
      username: user.username,
      role: user.role,
      marketId: user.marketId
    }));
    return true;
  }
  
  return false;
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

export const logoutUser = () => {
  localStorage.removeItem('currentUser');
};

// Las funciones isAdmin, isMarket, isVendedor ahora aceptan un objeto user opcional
// Esto permite verificar el rol de un usuario específico sin depender del currentUser global
export const isAdmin = (user = getCurrentUser()) => {
  return user?.role === 'admin';
};

export const isMarket = (user = getCurrentUser()) => {
  return user?.role === 'market';
};

export const isVendedor = (user = getCurrentUser()) => {
  return user?.role === 'vendedor';
};

export const getCurrentMarket = () => {
  const user = getCurrentUser();
  return user?.marketId;
};

// DONE