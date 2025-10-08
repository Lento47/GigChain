/**
 * GigChain Admin Panel - Main Layout
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertCircle,
  Store,
  BarChart3,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const { admin, logout } = useAdminStore();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/contracts', icon: FileText, label: 'Contracts' },
    { path: '/disputes', icon: AlertCircle, label: 'Disputes' },
    { path: '/marketplace', icon: Store, label: 'Marketplace' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/activity', icon: Activity, label: 'Activity Log' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>GigChain</h1>
          <span className="admin-badge">Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {admin?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <strong>{admin?.username}</strong>
              <span>{admin?.role}</span>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
