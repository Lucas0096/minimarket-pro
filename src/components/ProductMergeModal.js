import React, { useState } from 'react';

const ProductMergeModal = ({ productData, existingProduct, onConfirm, onCancel }) => {
  const [action, setAction] = useState('update'); // 'update' o 'new'

  const handleConfirm = () => {
    onConfirm(productData, action);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Producto Existente Detectado</h3>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          El producto <strong>"{productData.description}"</strong> ya existe en el sistema.
          <br />
          Stock actual: <strong>{existingProduct.stock}</strong> unidades.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ¿Qué acción deseas realizar?
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600 dark:bg-gray-700 dark:border-gray-600"
                name="mergeAction"
                value="update"
                checked={action === 'update'}
                onChange={() => setAction('update')}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Actualizar stock existente (sumar {productData.quantity} unidades)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600 dark:bg-gray-700 dark:border-gray-600"
                name="mergeAction"
                value="new"
                checked={action === 'new'}
                onChange={() => setAction('new')}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Crear un nuevo producto</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductMergeModal;