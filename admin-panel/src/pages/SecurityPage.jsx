import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../store/adminStore';
import './SecurityPage.css';

const SecurityPage = () => {
  const { token, admin } = useAdminStore();
  const [activeTab, setActiveTab] = useState('mfa');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethods, setMfaMethods] = useState([]);
  const [mfaStats, setMfaStats] = useState(null);
  
  // MFA Setup state
  const [setupStep, setSetupStep] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Wallet state
  const [walletAddress, setWalletAddress] = useState('');
  const [walletEmail, setWalletEmail] = useState('');
  const [walletLinked, setWalletLinked] = useState(false);
  
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchMFAStatus();
    fetchMFAStats();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/mfa/methods`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMfaEnabled(data.mfa_enabled);
        setMfaMethods(data.available_methods);
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error);
    }
  };

  const fetchMFAStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/mfa/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMfaStats(data.stats);
        setWalletLinked(data.stats.wallet_linked);
      }
    } catch (error) {
      console.error('Error fetching MFA stats:', error);
    }
  };

  const handleSetupMFA = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.qr_code);
        setSecret(data.secret);
        setBackupCodes(data.backup_codes);
        setSetupStep('scan');
        setMessage({ type: 'success', text: 'MFA setup initiated' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to setup MFA' });
      }
    } catch (error) {
      console.error('Error setting up MFA:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/mfa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_id: admin.admin_id,
          code: verificationCode,
          method: 'totp'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'MFA enabled successfully!' });
        setMfaEnabled(true);
        setSetupStep(null);
        fetchMFAStatus();
        fetchMFAStats();
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid verification code' });
      }
    } catch (error) {
      console.error('Error enabling MFA:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!walletAddress || walletAddress.length !== 42) {
      setMessage({ type: 'error', text: 'Please enter a valid wallet address' });
      return;
    }
    
    if (!walletEmail) {
      setMessage({ type: 'error', text: 'Please enter your email' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/mfa/wallet/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          email: walletEmail
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Wallet linked successfully!' });
        setWalletLinked(true);
        fetchMFAStats();
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to link wallet' });
      }
    } catch (error) {
      console.error('Error linking wallet:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = `GigChain Admin MFA Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes in a secure location.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gigchain-mfa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="security-page">
      <div className="page-header">
        <h1>🔐 Security Settings</h1>
        <p>Manage multi-factor authentication and security features</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'mfa' ? 'active' : ''}`}
          onClick={() => setActiveTab('mfa')}
        >
          MFA Setup
        </button>
        <button
          className={`tab ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet Authentication
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Security Stats
        </button>
      </div>

      <div className="tab-content">
        {/* MFA Setup Tab */}
        {activeTab === 'mfa' && (
          <div className="mfa-section">
            <div className="status-card">
              <div className="status-header">
                <h2>Multi-Factor Authentication</h2>
                <span className={`status-badge ${mfaEnabled ? 'enabled' : 'disabled'}`}>
                  {mfaEnabled ? '🔒 Enabled' : '🔓 Disabled'}
                </span>
              </div>
              
              <p className="status-description">
                Add an extra layer of security to your admin account with time-based one-time passwords (TOTP).
              </p>

              {!mfaEnabled && !setupStep && (
                <button
                  onClick={handleSetupMFA}
                  disabled={loading}
                  className="primary-btn"
                >
                  {loading ? 'Setting up...' : 'Setup MFA'}
                </button>
              )}

              {setupStep === 'scan' && (
                <div className="setup-flow">
                  <h3>Step 1: Scan QR Code</h3>
                  <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                  
                  <div className="qr-code-container">
                    <img src={qrCode} alt="QR Code" className="qr-code" />
                  </div>

                  <div className="secret-key">
                    <p>Or enter this secret key manually:</p>
                    <code>{secret}</code>
                  </div>

                  <h3>Step 2: Save Backup Codes</h3>
                  <p>These codes can be used if you lose access to your authenticator app.</p>
                  
                  <div className="backup-codes">
                    {backupCodes.map((code, index) => (
                      <code key={index}>{code}</code>
                    ))}
                  </div>

                  <button onClick={downloadBackupCodes} className="secondary-btn">
                    📥 Download Backup Codes
                  </button>

                  <h3>Step 3: Verify Setup</h3>
                  <p>Enter the 6-digit code from your authenticator app:</p>
                  
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="verification-input"
                    maxLength="6"
                  />

                  <div className="button-group">
                    <button
                      onClick={handleEnableMFA}
                      disabled={loading || verificationCode.length !== 6}
                      className="primary-btn"
                    >
                      {loading ? 'Verifying...' : 'Enable MFA'}
                    </button>
                    <button
                      onClick={() => setSetupStep(null)}
                      className="secondary-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {mfaEnabled && (
                <div className="mfa-enabled-info">
                  <h3>✅ MFA is Active</h3>
                  <p>Your account is protected with multi-factor authentication.</p>
                  
                  <div className="mfa-methods">
                    <h4>Active Methods:</h4>
                    <ul>
                      {mfaMethods.map((method) => (
                        <li key={method}>
                          {method === 'totp' && '📱 Authenticator App'}
                          {method === 'email' && '📧 Email OTP'}
                          {method === 'wallet' && '🔗 Wallet Signature'}
                          {method === 'backup_code' && '🔑 Backup Codes'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet Authentication Tab */}
        {activeTab === 'wallet' && (
          <div className="wallet-section">
            <div className="status-card">
              <div className="status-header">
                <h2>Wallet Authentication</h2>
                <span className={`status-badge ${walletLinked ? 'enabled' : 'disabled'}`}>
                  {walletLinked ? '🔗 Linked' : '⚠️ Not Linked'}
                </span>
              </div>
              
              <p className="status-description">
                Link your Web3 wallet to your admin account for secure wallet-based authentication.
              </p>

              {!walletLinked ? (
                <div className="wallet-setup">
                  <div className="form-group">
                    <label>Wallet Address</label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x..."
                      className="wallet-input"
                      maxLength="42"
                    />
                  </div>

                  <div className="form-group">
                    <label>Admin Email</label>
                    <input
                      type="email"
                      value={walletEmail}
                      onChange={(e) => setWalletEmail(e.target.value)}
                      placeholder="admin@gigchain.io"
                      className="email-input"
                    />
                  </div>

                  <button
                    onClick={handleLinkWallet}
                    disabled={loading}
                    className="primary-btn"
                  >
                    {loading ? 'Linking...' : 'Link Wallet'}
                  </button>
                </div>
              ) : (
                <div className="wallet-linked-info">
                  <h3>✅ Wallet Linked</h3>
                  <p>Your wallet is successfully linked to this admin account.</p>
                  
                  {mfaStats && mfaStats.wallet_linked && (
                    <div className="wallet-info">
                      <p><strong>Email:</strong> {admin?.email}</p>
                      <p className="info-text">
                        You can now use wallet signature as an MFA method for enhanced security.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Stats Tab */}
        {activeTab === 'stats' && mfaStats && (
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>MFA Status</h3>
                <div className="stat-value">
                  {mfaStats.mfa_enabled ? '✅ Enabled' : '❌ Disabled'}
                </div>
              </div>

              <div className="stat-card">
                <h3>Last Used Method</h3>
                <div className="stat-value">
                  {mfaStats.last_used_method || 'N/A'}
                </div>
              </div>

              <div className="stat-card">
                <h3>Wallet Linked</h3>
                <div className="stat-value">
                  {mfaStats.wallet_linked ? '✅ Yes' : '❌ No'}
                </div>
              </div>

              <div className="stat-card">
                <h3>Setup Date</h3>
                <div className="stat-value">
                  {mfaStats.setup_date 
                    ? new Date(mfaStats.setup_date).toLocaleDateString()
                    : 'Not configured'
                  }
                </div>
              </div>
            </div>

            {mfaStats.attempts_by_method && (
              <div className="attempts-section">
                <h3>Authentication Attempts</h3>
                <div className="attempts-grid">
                  {Object.entries(mfaStats.attempts_by_method).map(([method, stats]) => (
                    <div key={method} className="attempt-card">
                      <h4>{method.toUpperCase()}</h4>
                      <div className="attempt-stats">
                        <div className="stat-item">
                          <span className="stat-label">Total:</span>
                          <span className="stat-number">{stats.total}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Successful:</span>
                          <span className="stat-number success">{stats.successful}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Failed:</span>
                          <span className="stat-number error">{stats.total - stats.successful}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityPage;
