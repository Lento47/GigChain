/**
 * GigChain Admin Panel - Login Page
 */

import React, { useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import { Lock, User } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAdminStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    await login(username, password);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <Lock size={48} />
            </div>
            <h1>GigChain Admin Panel</h1>
            <p>Sign in to manage the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">
                <User size={20} />
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={20} />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="info-text">
              🔐 Default credentials: <strong>admin</strong> / <strong>admin123</strong>
            </p>
            <p className="warning-text">
              ⚠️ Change default password after first login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
