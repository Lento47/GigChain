import React, { useState } from 'react';
import { Wallet, Globe, Shield, ArrowRight, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import './WalletAuthGuide.css';

const WalletAuthGuide = ({ 
  onComplete, 
  showCompact = false,
  redirectReason = null 
}) => {
  const { 
    address, 
    isConnected, 
    isCorrectChain, 
    switchToCorrectChain, 
    isSwitching, 
    targetChain 
  } = useWallet();
  
  const [expandedStep, setExpandedStep] = useState(null);

  // Authentication steps
  const authSteps = [
    {
      id: 'install',
      title: 'Install Wallet',
      description: 'Get MetaMask or another Web3 wallet',
      icon: <Wallet size={20} />,
      status: 'info',
      completed: false,
      required: !isConnected,
      action: {
        text: 'Install MetaMask',
        url: 'https://metamask.io/download/',
        external: true
      }
    },
    {
      id: 'connect',
      title: 'Connect Wallet',
      description: 'Connect your wallet to GigChain',
      icon: <Shield size={20} />,
      status: isConnected ? 'success' : 'warning',
      completed: isConnected,
      required: !isConnected,
      action: {
        text: isConnected ? 'Connected' : 'Connect Wallet',
        onClick: !isConnected ? () => window.dispatchEvent(new Event('wallet-connect')) : null
      }
    },
    {
      id: 'network',
      title: 'Switch Network',
      description: `Switch to ${targetChain?.name}`,
      icon: <Globe size={20} />,
      status: isCorrectChain ? 'success' : (isConnected ? 'warning' : 'disabled'),
      completed: isCorrectChain,
      required: isConnected && !isCorrectChain,
      action: {
        text: isCorrectChain ? 'Correct Network' : `Switch to ${targetChain?.name}`,
        onClick: !isCorrectChain && isConnected ? switchToCorrectChain : null,
        disabled: isSwitching
      }
    },
    {
      id: 'access',
      title: 'Access Platform',
      description: 'Enter the GigChain platform',
      icon: <ArrowRight size={20} />,
      status: (isConnected && isCorrectChain) ? 'success' : 'disabled',
      completed: false,
      required: false,
      action: {
        text: 'Enter Platform',
        onClick: (isConnected && isCorrectChain) ? onComplete : null,
        disabled: !(isConnected && isCorrectChain)
      }
    }
  ];

  // Get redirect reason message
  const getRedirectMessage = () => {
    switch (redirectReason) {
      case 'wallet_not_connected':
        return {
          icon: <Wallet size={20} />,
          title: 'Wallet Connection Required',
          message: 'You need to connect your wallet to access the platform.',
          type: 'warning'
        };
      case 'wrong_network':
        return {
          icon: <Globe size={20} />,
          title: 'Network Switch Required',
          message: `Please switch to ${targetChain?.name} to continue.`,
          type: 'warning'
        };
      case 'invalid_wallet':
        return {
          icon: <AlertTriangle size={20} />,
          title: 'Invalid Wallet Detected',
          message: 'Please reconnect your wallet with a valid address.',
          type: 'error'
        };
      default:
        return null;
    }
  };

  const redirectMessage = getRedirectMessage();

  if (showCompact) {
    return (
      <div className="wallet-auth-guide compact">
        {redirectMessage && (
          <div className={`redirect-message ${redirectMessage.type}`}>
            {redirectMessage.icon}
            <div>
              <strong>{redirectMessage.title}</strong>
              <p>{redirectMessage.message}</p>
            </div>
          </div>
        )}
        
        <div className="auth-steps-compact">
          {authSteps.filter(step => step.required || step.id === 'access').map((step) => (
            <div key={step.id} className={`auth-step-compact ${step.status}`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
              {step.action && (
                <div className="step-action">
                  {step.action.url ? (
                    <a 
                      href={step.action.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                    >
                      {step.action.text}
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <button 
                      onClick={step.action.onClick}
                      disabled={step.action.disabled || step.completed}
                      className={`btn btn-sm ${step.completed ? 'btn-success' : 'btn-primary'}`}
                    >
                      {step.completed ? <CheckCircle size={14} /> : step.icon}
                      {step.action.text}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-auth-guide">
      <div className="auth-guide-header">
        <h2>Connect Your Wallet</h2>
        <p>Follow these steps to securely access GigChain</p>
      </div>

      {redirectMessage && (
        <div className={`redirect-message ${redirectMessage.type}`}>
          {redirectMessage.icon}
          <div>
            <strong>{redirectMessage.title}</strong>
            <p>{redirectMessage.message}</p>
          </div>
        </div>
      )}

      <div className="auth-steps">
        {authSteps.map((step, index) => (
          <div 
            key={step.id} 
            className={`auth-step ${step.status} ${step.completed ? 'completed' : ''}`}
            onClick={() => setExpandedStep(expandedStep === index ? null : index)}
          >
            <div className="step-header">
              <div className="step-indicator">
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">{step.icon}</div>
                {step.completed && <CheckCircle className="step-check" size={16} />}
              </div>
              <div className="step-info">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {step.action && (
                <div className="step-action" onClick={(e) => e.stopPropagation()}>
                  {step.action.url ? (
                    <a 
                      href={step.action.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      {step.action.text}
                      <ExternalLink size={16} />
                    </a>
                  ) : (
                    <button 
                      onClick={step.action.onClick}
                      disabled={step.action.disabled || step.completed}
                      className={`btn ${step.completed ? 'btn-success' : 'btn-primary'}`}
                    >
                      {step.completed ? <CheckCircle size={16} /> : step.icon}
                      {step.action.text}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Expanded content */}
            {expandedStep === index && (
              <div className="step-expanded">
                <div className="step-help">
                  {step.id === 'install' && (
                    <div>
                      <p><strong>Why do I need a wallet?</strong></p>
                      <p>Web3 wallets like MetaMask allow you to securely interact with blockchain applications without sharing your private keys.</p>
                      <ul>
                        <li>Your wallet is your identity on GigChain</li>
                        <li>All contracts and payments are tied to your wallet</li>
                        <li>Only you control your funds and data</li>
                      </ul>
                    </div>
                  )}
                  
                  {step.id === 'connect' && (
                    <div>
                      <p><strong>Safe connection process:</strong></p>
                      <ul>
                        <li>Click the wallet connect button</li>
                        <li>Choose your wallet provider (MetaMask recommended)</li>
                        <li>Approve the connection in your wallet</li>
                        <li>Your wallet address will be displayed</li>
                      </ul>
                      <p><em>GigChain never stores your private keys.</em></p>
                    </div>
                  )}
                  
                  {step.id === 'network' && (
                    <div>
                      <p><strong>Why {targetChain?.name}?</strong></p>
                      <ul>
                        <li>Low transaction costs (under $0.01)</li>
                        <li>Fast confirmations (2-3 seconds)</li>
                        <li>Compatible with Ethereum ecosystem</li>
                        <li>Environmentally friendly (Proof of Stake)</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Wallet Status */}
      <div className="wallet-status">
        <div className="status-item">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>Wallet: {isConnected ? 'Connected' : 'Not Connected'}</span>
          {isConnected && address && (
            <span className="wallet-address">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}
        </div>
        
        {isConnected && (
          <div className="status-item">
            <div className={`status-indicator ${isCorrectChain ? 'connected' : 'warning'}`} />
            <span>Network: {isCorrectChain ? targetChain?.name : 'Wrong Network'}</span>
          </div>
        )}
      </div>

      <div className="auth-guide-footer">
        <p className="security-note">
          <Shield size={16} />
          Your wallet information is never stored by GigChain. 
          We only request read access to your wallet address.
        </p>
      </div>
    </div>
  );
};

export default WalletAuthGuide;
