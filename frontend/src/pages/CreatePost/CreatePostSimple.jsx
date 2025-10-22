import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3 } from 'lucide-react';

const CreatePostSimple = () => {
  const navigate = useNavigate();

  // Redirect to feed (where create post button exists)
  React.useEffect(() => {
    navigate('/feed', { state: { openCreatePost: true } });
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh' 
    }}>
      <Edit3 size={32} />
      <p style={{ marginLeft: '1rem', color: '#a0aec0' }}>Redirigiendo a Feed...</p>
    </div>
  );
};

export default CreatePostSimple;

