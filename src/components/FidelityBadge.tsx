import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getAccessToken } from '../utils/storage';
import { api } from '../config/env';

interface FidelityData {
  fidelityPoints: number;
  lastPurchaseDate?: string;
}

export const FidelityBadge: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [fidelityData, setFidelityData] = useState<FidelityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['fidelityPoints', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`${api.baseURL}/api/users/${user.id}/fidelity-points`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Error fetching fidelity points');
      return response.json();
    },
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  useEffect(() => {
    if (data) {
      setFidelityData(data);
    }
  }, [data]);

  if (!isAuthenticated || !fidelityData) {
    return null;
  }

  const discountValue = (fidelityData.fidelityPoints / 100) * 10;

  return (
    <div className="fidelity-badge" title={`Puntos de fidelización: ${fidelityData.fidelityPoints}`}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ marginRight: '6px' }}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="points-text">
        {fidelityData.fidelityPoints} pts
      </span>
      {fidelityData.fidelityPoints >= 10 && (
        <span className="discount-hint">
          (S/ {discountValue.toFixed(2)})
        </span>
      )}
    </div>
  );
};

// Estilos para agregar en Navbar.css
const styles = `
.fidelity-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: default;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
  transition: all 0.3s ease;
}

.fidelity-badge:hover {
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
  transform: translateY(-1px);
}

.fidelity-badge .points-text {
  letter-spacing: 0.5px;
}

.fidelity-badge .discount-hint {
  font-size: 11px;
  opacity: 0.9;
  margin-left: 4px;
  border-left: 1px solid rgba(255, 255, 255, 0.5);
  padding-left: 4px;
}

@media (max-width: 768px) {
  .fidelity-badge {
    padding: 4px 8px;
    font-size: 12px;
  }

  .fidelity-badge .discount-hint {
    display: none;
  }
}
`;
