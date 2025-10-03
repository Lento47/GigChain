import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import './ThirdwebStatus.css';

export const ThirdwebStatus = () => {
  const { 
    isConnected, 
    isCorrectChain, 
    walletInfo, 
    getNetworkInfo,
    targetChain 
  } = useWallet();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const networkInfo = getNetworkInfo();

  const refreshStatus = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  const getStatusIcon = () => {
    if (!isConnected) return <AlertCircle size={20} className="status-icon disconnected" />;
    if (isCorrectChain) return <CheckCircle size={20} className="status-icon connected" />;
    return <AlertCircle size={20} className="status-icon warning" />;
  };

  const getStatusText = () => {
    if (!isConnected) return 'Wallet no conectada';
    if (isCorrectChain) return 'Conectado correctamente';
    return 'Red incorrecta';
  };

  const getStatusColor = () => {
    if (!isConnected) return '#ef4444';
    if (isCorrectChain) return '#10b981';
    return '#f59e0b';
  };

  const openExplorer = () => {
    if (!walletInfo?.address) return;
    const explorerUrl = `https://polygonscan.com/address/${walletInfo.address}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="thirdweb-status">
      <div className="status-header">
        <div className="status-title">
          <h3>Estado de Thirdweb</h3>
          <button 
            className="refresh-btn"
            onClick={refreshStatus}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
          </button>
        </div>
        <div className="last-update">
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      <div className="status-content">
        <div className="status-item">
          <div className="status-icon-container">
            {getStatusIcon()}
          </div>
          <div className="status-details">
            <div className="status-label">Conexión</div>
            <div 
              className="status-value"
              style={{ color: getStatusColor() }}
            >
              {getStatusText()}
            </div>
          </div>
        </div>

        {isConnected && walletInfo && (
          <>
            <div className="status-item">
              <div className="status-icon-container">
                <CheckCircle size={20} className="status-icon info" />
              </div>
              <div className="status-details">
                <div className="status-label">Dirección</div>
                <div className="status-value address-value">
                  {walletInfo.shortAddress}
                  <button 
                    className="copy-address-btn"
                    onClick={() => navigator.clipboard.writeText(walletInfo.address)}
                    title="Copiar dirección completa"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div className="status-item">
              <div className="status-icon-container">
                <CheckCircle size={20} className="status-icon info" />
              </div>
              <div className="status-details">
                <div className="status-label">Red</div>
                <div className="status-value">
                  {walletInfo.network}
                  <button 
                    className="explorer-btn"
                    onClick={openExplorer}
                    title="Ver en explorador"
                  >
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="status-item">
          <div className="status-icon-container">
            <CheckCircle size={20} className="status-icon info" />
          </div>
          <div className="status-details">
            <div className="status-label">Redes Soportadas</div>
            <div className="status-value">
              {networkInfo.supportedChains.map((chain, index) => (
                <span 
                  key={chain.chainId}
                  className={`chain-tag ${chain.isActive ? 'active' : ''}`}
                >
                  {chain.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!isCorrectChain && isConnected && (
        <div className="status-warning">
          <AlertCircle size={16} />
          <span>
            Tu wallet está conectada a una red diferente. 
            Cambia a {targetChain.name} para usar todas las funciones.
          </span>
        </div>
      )}

      <div className="status-actions">
        <button 
          className="action-btn primary"
          onClick={() => window.open('https://thirdweb.com', '_blank')}
        >
          <ExternalLink size={16} />
          Documentación Thirdweb
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => window.open('https://polygonscan.com', '_blank')}
        >
          <ExternalLink size={16} />
          Explorador Polygon
        </button>
      </div>
    </div>
  );
};

export default ThirdwebStatus;
