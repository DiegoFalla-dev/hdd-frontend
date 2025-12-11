import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAccessToken } from '../utils/storage';
import { API_BASE_URL } from '../config/env';

interface FidelityRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePoints: number;
  onRedeemSuccess: (pointsRedeemed: number, discountAmount: number) => void;
}

export const FidelityRedeemModal: React.FC<FidelityRedeemModalProps> = ({
  isOpen,
  onClose,
  availablePoints,
  onRedeemSuccess,
}) => {
  const { user } = useAuth();
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPointsToRedeem(100);
      setMessage(null);
    }
  }, [isOpen]);

  const discountValue = (pointsToRedeem / 100) * 10;
  const isValid = pointsToRedeem > 0 && pointsToRedeem <= availablePoints && pointsToRedeem % 10 === 0;

  const handleRedeem = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Usuario no identificado' });
      return;
    }

    if (!isValid) {
      setMessage({ type: 'error', text: 'Cantidad de puntos inválida' });
      return;
    }

    setIsLoading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        setMessage({ type: 'error', text: 'No hay sesión activa' });
        setIsLoading(false);
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/users/${user.id}/redeem-points`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ points: pointsToRedeem }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({ type: 'error', text: data.message || 'Error al canjear puntos' });
        return;
      }

      setMessage({ type: 'success', text: `¡${pointsToRedeem} puntos canjeados por S/ ${discountValue.toFixed(2)}!` });
      setTimeout(() => {
        onRedeemSuccess(pointsToRedeem, discountValue);
        onClose();
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al procesar el canje' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fidelity-redeem-overlay" onClick={onClose}>
      <div className="fidelity-redeem-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fidelity-redeem-header">
          <h2>Canjear Puntos de Fidelización</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="fidelity-redeem-body">
          {/* Información de puntos disponibles */}
          <div className="points-info">
            <div className="info-card">
              <span className="label">Puntos Disponibles:</span>
              <span className="value">{availablePoints} pts</span>
            </div>
            <div className="info-card">
              <span className="label">Descuento Máximo:</span>
              <span className="value">S/ {((availablePoints / 100) * 10).toFixed(2)}</span>
            </div>
          </div>

          {/* Input de puntos */}
          <div className="input-section">
            <label htmlFor="points-input">¿Cuántos puntos deseas canjear?</label>
            <div className="input-group">
              <input
                id="points-input"
                type="number"
                min="0"
                max={availablePoints}
                step="10"
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isLoading}
                className="points-input"
              />
              <span className="input-suffix">puntos</span>
            </div>
            <small className="hint">Los puntos se canjean en múltiplos de 10</small>
          </div>

          {/* Resumen de canje */}
          <div className="redemption-summary">
            <div className="summary-row">
              <span>Puntos a canjear:</span>
              <strong>{pointsToRedeem} pts</strong>
            </div>
            <div className="summary-row highlight">
              <span>Descuento equivalente:</span>
              <strong className="discount-amount">S/ {discountValue.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Puntos restantes:</span>
              <strong>{Math.max(0, availablePoints - pointsToRedeem)} pts</strong>
            </div>
          </div>

          {/* Mensaje */}
          {message && (
            <div className={`message message-${message.type}`}>
              {message.type === 'success' && '✓ '}
              {message.type === 'error' && '⚠ '}
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fidelity-redeem-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className={`btn-redeem ${isValid ? 'active' : 'disabled'}`}
            onClick={handleRedeem}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Procesando...' : `Canjear ${pointsToRedeem} puntos`}
          </button>
        </div>
      </div>
    </div>
  );
};

// Estilos para agregar en un archivo CSS dedicado o en el componente principal
const styles = `
.fidelity-redeem-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fidelity-redeem-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.fidelity-redeem-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.fidelity-redeem-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.fidelity-redeem-header .close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: transform 0.2s;
}

.fidelity-redeem-header .close-btn:hover {
  transform: scale(1.2);
}

.fidelity-redeem-body {
  padding: 20px;
}

.points-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.info-card {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-card .label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-card .value {
  font-size: 18px;
  font-weight: 600;
  color: #ff6b35;
}

.input-section {
  margin-bottom: 24px;
}

.input-section label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: border-color 0.3s;
}

.points-input:focus {
  outline: none;
  border-color: #ff6b35;
}

.points-input:disabled {
  background: #f5f5f5;
  color: #999;
}

.input-suffix {
  color: #666;
  font-weight: 500;
}

.input-section small {
  display: block;
  margin-top: 6px;
  color: #999;
  font-size: 12px;
}

.redemption-summary {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #333;
}

.summary-row.highlight {
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%);
  border-radius: 6px;
  margin: 8px 0;
  font-weight: 600;
}

.discount-amount {
  color: #ff6b35;
  font-size: 16px;
}

.conversion-chart {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.conversion-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.conversion-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.conversion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
}

.conv-pts {
  font-weight: 600;
  color: #333;
}

.conv-arrow {
  color: #ddd;
  margin: 0 4px;
}

.conv-sol {
  color: #ff6b35;
  font-weight: 600;
}

.message {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.fidelity-redeem-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.btn-cancel,
.btn-redeem {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #e0e0e0;
  color: #333;
}

.btn-cancel:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-redeem {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.btn-redeem.active:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
  transform: translateY(-2px);
}

.btn-redeem.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .fidelity-redeem-modal {
    width: 95%;
  }

  .points-info {
    grid-template-columns: 1fr;
  }

  .conversion-grid {
    grid-template-columns: 1fr;
  }

  .fidelity-redeem-footer {
    flex-direction: column;
  }
}
`;
