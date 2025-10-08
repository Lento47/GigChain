/**
 * GigChain Admin Panel - Users Management Page
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  Filter,
  Ban,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await axios.get(`/api/admin/users${params}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus, reason) => {
    try {
      await axios.put('/api/admin/users/status', {
        user_id: userId,
        status: newStatus,
        reason,
      });
      
      // Refresh users list
      fetchUsers();
      alert(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>
          <Users size={32} />
          User Management
        </h1>
        <p>Manage all platform users</p>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by wallet, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <button className="refresh-button" onClick={fetchUsers}>
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="users-stats">
        <div className="stat">
          <strong>{users.length}</strong>
          <span>Total</span>
        </div>
        <div className="stat">
          <strong>{users.filter(u => u.status === 'active').length}</strong>
          <span>Active</span>
        </div>
        <div className="stat">
          <strong>{users.filter(u => u.status === 'suspended').length}</strong>
          <span>Suspended</span>
        </div>
        <div className="stat">
          <strong>{users.filter(u => u.status === 'banned').length}</strong>
          <span>Banned</span>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Wallet Address</th>
                <th>Username</th>
                <th>Status</th>
                <th>Reputation</th>
                <th>Contracts</th>
                <th>Trust Score</th>
                <th>Total Earned</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.user_id}>
                  <td className="wallet-cell">
                    {user.wallet_address ? (
                      <>
                        {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{user.username || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.reputation_score || 0}</td>
                  <td>{user.total_contracts || 0}</td>
                  <td>
                    <div className="trust-score">
                      {user.trust_score || 0}%
                      <div className="trust-bar">
                        <div
                          className="trust-fill"
                          style={{ width: `${user.trust_score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>${(user.total_earned || 0).toFixed(2)}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => setSelectedUser(user)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {user.status === 'active' && (
                        <>
                          <button
                            className="btn-icon btn-warning"
                            onClick={() => {
                              if (confirm('Suspend this user?')) {
                                handleUpdateStatus(user.user_id, 'suspended', 'Admin action');
                              }
                            }}
                            title="Suspend"
                          >
                            <AlertCircle size={16} />
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => {
                              if (confirm('Ban this user? This action is severe.')) {
                                handleUpdateStatus(user.user_id, 'banned', 'Admin action');
                              }
                            }}
                            title="Ban"
                          >
                            <Ban size={16} />
                          </button>
                        </>
                      )}
                      {(user.status === 'suspended' || user.status === 'banned') && (
                        <button
                          className="btn-icon btn-success"
                          onClick={() => {
                            if (confirm('Activate this user?')) {
                              handleUpdateStatus(user.user_id, 'active', 'Restored by admin');
                            }
                          }}
                          title="Activate"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="no-data">
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose, onUpdate }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-row">
            <label>User ID:</label>
            <span>{user.user_id}</span>
          </div>
          <div className="detail-row">
            <label>Wallet Address:</label>
            <span className="monospace">{user.wallet_address}</span>
          </div>
          <div className="detail-row">
            <label>Username:</label>
            <span>{user.username || 'Not set'}</span>
          </div>
          <div className="detail-row">
            <label>Email:</label>
            <span>{user.email || 'Not set'}</span>
          </div>
          <div className="detail-row">
            <label>Status:</label>
            <span className={`status-badge status-${user.status}`}>
              {user.status}
            </span>
          </div>
          <div className="detail-row">
            <label>Reputation Score:</label>
            <span>{user.reputation_score || 0}</span>
          </div>
          <div className="detail-row">
            <label>Total Contracts:</label>
            <span>{user.total_contracts || 0}</span>
          </div>
          <div className="detail-row">
            <label>Total Earned:</label>
            <span>${(user.total_earned || 0).toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <label>Trust Score:</label>
            <span>{user.trust_score || 0}%</span>
          </div>
          <div className="detail-row">
            <label>Verified:</label>
            <span>{user.is_verified ? '✓ Yes' : '✗ No'}</span>
          </div>
          <div className="detail-row">
            <label>Created:</label>
            <span>{new Date(user.created_at).toLocaleString()}</span>
          </div>
          {user.last_active && (
            <div className="detail-row">
              <label>Last Active:</label>
              <span>{new Date(user.last_active).toLocaleString()}</span>
            </div>
          )}
          {user.notes && (
            <div className="detail-row">
              <label>Notes:</label>
              <span>{user.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
