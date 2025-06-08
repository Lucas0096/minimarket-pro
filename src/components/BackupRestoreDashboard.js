import React, { useState } from 'react';
import { getAllData, clearStore, putData, addData, STORES } from '../utils/indexedDb';
import { getCurrentUser } from '../utils/auth';

const BackupRestoreDashboard = () => {
  const [message, setMessage] = useState({ type: '', text: '' });
  const currentUser = getCurrentUser();

  const handleExportData = async () => {
    try {
      const backupData = {};
      for (const storeName of STORES) {
        if (!currentUser || currentUser.role !== 'admin') {
          if (storeName.startsWith('cashMovements_') || storeName.startsWith('cashRegisterState_')) {
            if (!storeName.includes(currentUser.username)) {
              continue;
            }
          }
        }
        backupData[storeName] = await getAllData(storeName);
      }
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minimarket_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup exportado con éxito.' });
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({ type: 'error', text: `Error al exportar backup: ${error.message}` });
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!window.confirm('¿Estás seguro de que quieres importar este backup? Esto sobrescribirá los datos actuales.')) {
          return;
        }

        for (const storeName of STORES) {
          if (importedData[storeName]) {
            await clearStore(storeName);
            for (const item of importedData[storeName]) {
              await putData(storeName, item); 
            }
          }
        }
        setMessage({ type: 'success', text: 'Backup importado con éxito. Recarga la página para ver los cambios.' });
      } catch (error) {
        console.error('Error importing data:', error);
        setMessage({ type: 'error', text: `Error al importar backup: ${error.message}` });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Backup y Restauración</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Exportar Datos</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Descarga una copia de seguridad de todos tus datos en formato JSON.
            Este archivo puede ser usado para restaurar tu información en el futuro.
          </p>
          <button
            onClick={handleExportData}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Descargar Backup (JSON)
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg shadow-inner dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Importar Backup</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Sube un archivo JSON de backup para restaurar tus datos.
            ¡Atención! Esto sobrescribirá los datos existentes.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-lg dark:bg-yellow-800 dark:border-yellow-600 dark:text-yellow-100">
        <p className="font-bold">Nota sobre Backups Automáticos:</p>
        <p className="text-sm">
          La funcionalidad de "Backup diario automático en NAS o almacenamiento externo"
          requiere una integración con un sistema de servidor o un servicio en la nube
          (como AWS S3, Google Cloud Storage, etc.) y no puede ser implementada
          directamente desde una aplicación web de frontend puro.
          Esto implicaría un backend que gestione la conexión con el NAS/almacenamiento
          y la programación de las tareas de backup.
        </p>
      </div>
    </div>
  );
};

export default BackupRestoreDashboard;