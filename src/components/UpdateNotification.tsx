import React from 'react';
import { FiRefreshCw, FiX } from 'react-icons/fi';

interface UpdateNotificationProps {
  /** Mostrar la notificación */
  show: boolean;
  /** Mensaje a mostrar */
  message?: string;
  /** Callback al hacer refresh */
  onRefresh: () => void;
  /** Callback al descartar */
  onDismiss: () => void;
  /** Posición de la notificación */
  position?: 'top' | 'bottom';
}

/**
 * Componente de notificación para actualizaciones en tiempo real
 */
export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  show,
  message = '¡Hay nuevas películas disponibles!',
  onRefresh,
  onDismiss,
  position = 'top',
}) => {
  if (!show) return null;

  const positionClasses = position === 'top' 
    ? 'top-20' 
    : 'bottom-4';

  return (
    <div 
      className={`fixed left-1/2 -translate-x-1/2 ${positionClasses} z-50 animate-slideDown`}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-linear-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-4 min-w-[320px]">
        <div className="flex-1 flex items-center gap-3">
          <FiRefreshCw className="text-xl animate-pulse" />
          <span className="font-medium text-sm">{message}</span>
        </div>
        
        <button
          onClick={onRefresh}
          className="px-4 py-1.5 bg-white text-red-600 rounded font-semibold text-sm hover:bg-gray-100 transition"
          aria-label="Actualizar ahora"
        >
          Actualizar
        </button>
        
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-red-800 rounded transition"
          aria-label="Descartar notificación"
        >
          <FiX className="text-xl" />
        </button>
      </div>
    </div>
  );
};

/**
 * Versión compacta para uso en headers/navbars
 */
export const UpdateBadge: React.FC<{
  show: boolean;
  onClick: () => void;
}> = ({ show, onClick }) => {
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className="relative px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition animate-pulse"
      aria-label="Hay actualizaciones disponibles"
    >
      <span className="flex items-center gap-1.5">
        <FiRefreshCw className="text-sm" />
        Nuevo
      </span>
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white" />
    </button>
  );
};

export default UpdateNotification;
