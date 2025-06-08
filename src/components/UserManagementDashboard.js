import React, { useState, useEffect } from 'react';
import { isAdmin } from '../utils/auth';
import { getAllData, putData, syncLocalStorageWithIndexedDB } from '../utils/indexedDb';

const UserManagementDashboard = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadUsers = async () => {
      const allUsers = await getAllData('users');
      const filteredUsers = allUsers.filter(u => u.role !== 'admin');
      setUsers(filteredUsers);
    };
    loadUsers();
  }, []);

  const handleAction = async (userId, actionType, value = null) => {
    setMessage({ type: '', text: '' });
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    let updatedUser = { ...userToUpdate };
    let actionMessage = '';

    switch (actionType) {
      case 'resetDays':
        updatedUser.daysRemaining = 30;
        actionMessage = `Días de suscripción de ${updatedUser.username} reseteados a 30.`;
        break;
      case 'blockAccess':
        updatedUser.accessBlocked = true;
        actionMessage = `Acceso de ${updatedUser.username} bloqueado.`;
        break;
      case 'extendDays':
        updatedUser.daysRemaining = (updatedUser.daysRemaining || 0) + (parseInt(value) || 0);
        actionMessage = `Días de suscripción de ${updatedUser.username} extendidos en ${value} días.`;
        break;
      case 'sendReminder':
        actionMessage = `Recordatorio de pago enviado a ${updatedUser.username}. (Simulado)`;
        break;
      case 'unblockAccess':
        updatedUser.accessBlocked = false;
        actionMessage = `Acceso de ${updatedUser.username} desbloqueado.`;
        break;
      default:
        return;
    }

    try {
      await putData('users', updatedUser);
      const updatedUsersList = users.map(u => u.id === userId ? updatedUser : u);
      setUsers(updatedUsersList);
      syncLocalStorageWithIndexedDB('users', updatedUsersList);
      setMessage({ type: 'success', text: actionMessage });
    } catch (error) {
      setMessage({ type: 'error', text: `Error al realizar la acción: ${error.message}` });
    }
  };

  const getOnlineStatus = (userId) => {
    return Math.random() > 0.5 ? 'Online' : 'Offline';
  };

  const getLastActiveTime = (userId) => {
    const minutesAgo = Math.floor(Math.random() * 120);
    if (minutesAgo < 60) return `Hace ${minutesAgo} min`;
    return `Hace ${Math.floor(minutesAgo / 60)} hr ${minutesAgo % 60} min`;
  };

  if (!isAdmin()) {
    return <div className="text-center py-10 text-gray-800 dark:text-white">Acceso no autorizado. Solo el administrador principal puede ver esta sección.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Panel de Administración de Usuarios</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
        {users.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Mercado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Última Actividad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Días Restantes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{user.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{user.marketId || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      getOnlineStatus(user.id) === 'Online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    }`}>
                      {getOnlineStatus(user.id)}
                    </span>
                    {user.accessBlocked && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Bloqueado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{getLastActiveTime(user.id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.daysRemaining !== undefined ? `${user.daysRemaining} días` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAction(user.id, 'resetDays')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                      >
                        Resetear Días
                      </button>
                      {!user.accessBlocked ? (
                        <button
                          onClick={() => handleAction(user.id, 'blockAccess')}
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                        >
                          Bloquear Acceso
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.id, 'unblockAccess')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                        >
                          Desbloquear
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(user.id, 'extendDays', 30)}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
                      >
                        Extender 30 Días
                      </button>
                      <button
                        onClick={() => handleAction(user.id, 'sendReminder')}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                      >
                        Recordatorio Pago
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 dark:text-gray-300">No hay usuarios registrados (excepto administradores).</p>
        )}
      </div>
    </div>
  );
};

export default UserManagementDashboard;