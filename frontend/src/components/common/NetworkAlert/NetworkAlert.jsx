import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import './NetworkAlert.css';

const NetworkAlert = ({ isCorrectChain, switchToCorrectChain, isSwitching, targetChain }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Don't show if on correct chain
  if (isCorrectChain) return null;

  const handleSwitchClick = async () => {
    try {
      await switchToCorrectChain();
    } catch (error) {
      // Show manual instructions if auto-switch fails
      setShowInstructions(true);
    }
  };

  return (
    <div className="network-alert">
      <div className="network-alert-content">
        <div className="network-alert-icon">
          <AlertCircle size={24} />
        </div>
        <div className="network-alert-message">
          <h3>Red Incorrecta Detectada</h3>
          <p>
            Esta aplicación requiere <strong>{targetChain?.name || 'Polygon Amoy Testnet'}</strong> (Chain ID: {targetChain?.chainId || 80002}).
          </p>
          <p className="deprecation-notice">
            ⚠️ <strong>Nota:</strong> Mumbai testnet está deprecada. Ahora usamos <strong>Amoy</strong>.
          </p>
          {showInstructions && (
            <div className="manual-instructions">
              <p><strong>Cambia manualmente en MetaMask:</strong></p>
              <ol>
                <li>Haz clic en MetaMask (ícono del zorro)</li>
                <li>Haz clic en el nombre de la red (arriba)</li>
                <li>Selecciona "Polygon Amoy" (la nueva testnet)</li>
              </ol>
              <p>
                <strong>¿No tienes Amoy?</strong> Agrégala desde{' '}
                <a 
                  href="https://chainlist.org/?search=amoy&testnets=true" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="chainlist-link"
                >
                  Chainlist <ExternalLink size={14} />
                </a>
              </p>
              <p className="amoy-manual-add">
                <strong>O agrega manualmente:</strong><br/>
                Network: Polygon Amoy Testnet<br/>
                RPC: https://rpc-amoy.polygon.technology<br/>
                Chain ID: 80002<br/>
                Symbol: MATIC<br/>
                Explorer: https://amoy.polygonscan.com
              </p>
            </div>
          )}
        </div>
        <div className="network-alert-buttons">
          <button
            className="network-alert-button primary"
            onClick={handleSwitchClick}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <>
                <RefreshCw size={18} className="spinning" />
                <span>Cambiando...</span>
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                <span>Cambiar Automático</span>
              </>
            )}
          </button>
          {!showInstructions && (
            <button
              className="network-alert-button secondary"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              ¿Cómo cambiar?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkAlert;

