import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const ConnectionsSimple = () => {
  const navigate = useNavigate();

  // Redirect to profile with connections tab
  React.useEffect(() => {
    navigate('/profile', { state: { activeTab: 'connections' } });
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh' 
    }}>
      <Users size={32} />
      <p style={{ marginLeft: '1rem', color: '#a0aec0' }}>Redirigiendo a Perfil...</p>
    </div>
  );
};

export default ConnectionsSimple;

