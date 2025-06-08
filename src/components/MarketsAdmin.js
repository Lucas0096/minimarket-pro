import React, { useState, useEffect } from 'react';
import { isAdmin } from '../utils/auth';
import { getAllData, putData, addData, deleteData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';

const MarketsAdmin = ({ onSelectMarket }) => {
  const [markets, setMarkets] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newMarketName, setNewMarketName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('vendedor');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showUserForm, setShowUserForm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const savedMarkets = await getAllData('markets');
      const savedUsers = await getAllData('users');
      setMarkets(savedMarkets);
      setUsers(savedUsers);
    };
    loadData();
  }, []);

  const handleAddMarket = async () => {
    if (!newMarketName.trim()) {
      setMessage({ type: 'error', text: 'El nombre del mercado no puede estar vacío.' });
      return;
    }
    
    const newMarket = {
      id: `market${Date.now()}`,
      name: newMarketName.trim()
    };
    
    const updatedMarkets = [...markets, newMarket];
    await addData('markets', newMarket);
    setMarkets(updatedMarkets);
    syncLocalStorageWithIndexedDB('markets', updatedMarkets);
    setNewMarketName('');
    setMessage({ type: 'success', text: `Mercado "${newMarket.name}" agregado con éxito.` });
  };

  const handleAddUser = async () => {
    setMessage({ type: '', text: '' });
    if (!newUsername.trim() || !newPassword.trim() || !selectedMarket) {
      setMessage({ type: 'error', text: 'Todos los campos de usuario son obligatorios.' });
      return;
    }

    const allUsers = await getAllData('users');
    if (allUsers.some(u => u.username === newUsername.trim())) {
      setMessage({ type: 'error', text: `El usuario "${newUsername.trim()}" ya existe. Por favor, elige otro.` });
      return;
    }
    
    const newUser = {
      id: Date.now(),
      username: newUsername.trim(),
      password: newPassword.trim(),
      role: newUserRole,
      marketId: selectedMarket
    };
    
    const updatedUsers = [...users, newUser];
    await addData('users', newUser);
    setUsers(updatedUsers);
    syncLocalStorageWithIndexedDB('users', updatedUsers);
    resetUserForm();
    setMessage({ type: 'success', text: `Usuario "${newUser.username}" creado con éxito.` });
  };

  const handleUpdateUser = async () => {
    setMessage({ type: '', text: '' });
    if (!editingUser || !editingUser.username || !editingUser.password) {
      setMessage({ type: 'error', text: 'Todos los campos de usuario son obligatorios.' });
      return;
    }
    
    const updatedUsers = users.map(u => 
      u.id === editingUser.id ? editingUser : u
    );
    
    await putData('users', editingUser);
    setUsers(updatedUsers);
    syncLocalStorageWithIndexedDB('users', updatedUsers);
    handleCancelEdit();
    setMessage({ type: 'success', text: `Usuario "${editingUser.username}" actualizado con éxito.` });
  };

  const handleDeleteUser = async (id) => {
    setMessage({ type: '', text: '' });
    const userToDelete = users.find(u => u.id === id);
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${userToDelete.username}"?`)) {
      await deleteData('users', id);
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      syncLocalStorageWithIndexedDB('users', updatedUsers);
      setMessage({ type: 'success', text: `Usuario "${userToDelete.username}" eliminado con éxito.` });
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({...user});
    setShowUserForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setShowUserForm(false);
    resetUserForm();
  };

  const resetUserForm = () => {
    setNewUsername('');
    setNewPassword('');
    setNewUserRole('vendedor');
    setSelectedMarket('');
  };

  if (!isAdmin()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Administración de Mercados</h2>
      
      {message.text && (
        <div className={`p-3 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Crear Nuevo Mercado</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMarketName}
              onChange={(e) => setNewMarketName(e.target.value)}
              placeholder="Nombre del mercado"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
            <button
              onClick={handleAddMarket}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Agregar
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h3>
          <div className="space-y-3">
            <select
              value={editingUser?.marketId || selectedMarket}
              onChange={(e) => 
                editingUser 
                  ? setEditingUser({...editingUser, marketId: e.target.value})
                  : setSelectedMarket(e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            >
              <option value="">Seleccionar mercado</option>
              {markets.map(market => (
                <option key={market.id} value={market.id}>{market.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={editingUser?.username || newUsername}
              onChange={(e) => 
                editingUser
                  ? setEditingUser({...editingUser, username: e.target.value})
                  : setNewUsername(e.target.value)
              }
              placeholder="Nombre de usuario"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              disabled={!!editingUser}
            />
            <input
              type="password"
              value={editingUser?.password || newPassword}
              onChange={(e) => 
                editingUser
                  ? setEditingUser({...editingUser, password: e.target.value})
                  : setNewPassword(e.target.value)
              }
              placeholder="Contraseña"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
            {/* Selector de Rol */}
            <select
              value={editingUser?.role || newUserRole}
              onChange={(e) => 
                editingUser
                  ? setEditingUser({...editingUser, role: e.target.value})
                  : setNewUserRole(e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            >
              <option value="market">Dueño (Market)</option>
              <option value="vendedor">Vendedor</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {editingUser ? 'Actualizar' : 'Crear'}
              </button>
              {editingUser && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">Listado de Mercados</h3>
          <select
            onChange={(e) => onSelectMarket(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Ver todos los mercados</option>
            {markets.map(market => (
              <option key={market.id} value={market.id}>{market.name}</option>
            ))}
          </select>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Usuarios</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {markets.map(market => (
              <tr key={market.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{market.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{market.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 space-y-1 dark:text-white">
                    {users
                      .filter(u => u.marketId === market.id)
                      .map(user => (
                        <div key={user.id} className="flex justify-between">
                          <span>
                            {user.username} ({user.role})
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMarket(market.id);
                      setShowUserForm(true);
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    + Agregar Usuario
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketsAdmin;