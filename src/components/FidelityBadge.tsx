import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '../utils/storage';
import { api } from '../config/env';

interface FidelityData {
  fidelityPoints: number;
}

export const FidelityBadge: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [fidelityData, setFidelityData] = useState<FidelityData | null>(null);
  // Comentado: isLoading y setIsLoading no se usan
  // const [isLoading, setIsLoading] = useState(false);

  // Comentado: refetch no se usa
  const { data } = useQuery({
    queryKey: ['fidelityPoints', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
<<<<<<< HEAD
      const response = await fetch(`${api.baseURL}/api/users/${user.id}/fidelity-points`, {
=======
      const token = getAccessToken();
      if (!token) return null;
      const url = `${API_BASE_URL}/users/${user.id}/fidelity-points`;
      const response = await fetch(url, {
>>>>>>> f36d5c719808a96ef31ee35c5386be6a390c0321
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
  const pointsText = `Puntos de fidelización: ${fidelityData.fidelityPoints}`;

  return (
    <div className="fidelity-badge" title={pointsText}>
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

// Comentado: styles no se usa en el componente
// Estilos CSS comentados para evitar código sin usar
