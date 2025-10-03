import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Wifi, WifiOff, Loader } from 'lucide-react';

export const NetworkAlert = ({ isConnected, isCorrectChain, onSwitchChain, isSwitching }) => {
  const [switchError, setSwitchError] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when network status changes
  useEffect(() => {
    if (isCorrectChain) {
      setIsDismissed(false);
      setSwitchError(null);
    }
  }, [isCorrectChain]);

  const handleSwitchChain = async () => {
    try {
      setSwitchError(null);
      await onSwitchChain();
      // Hide alert after successful switch
      setTimeout(() => setIsDismissed(true), 2000);
    } catch (error) {
      setSwitchError(error.message || 'Error al cambiar de red');
      console.error('Network switch error:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show alert if wallet is not connected, is on correct chain, or has been dismissed
  if (!isConnected || isCorrectChain || isDismissed) {
    return null;
  }

  return (
    <div className="network-alert incorrect">
      <div className="alert-content">
        <AlertCircle size={20} />
        <span>Red incorrecta</span>
        <button 
          className="alert-close"
          onClick={handleDismiss}
          title="Cerrar alerta"
        >
          ×
        </button>
      </div>
      <div className="alert-message">
        Tu wallet está conectado a una red diferente.
        <div className="switch-actions">
          <button 
            className="switch-network-btn"
            onClick={handleSwitchChain}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <>
                <Loader size={14} className="spinning" />
                Cambiando...
              </>
            ) : (
              'Cambiar a Mumbai'
            )}
          </button>
          {switchError && (
            <div className="switch-error">
              {switchError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkAlert;
