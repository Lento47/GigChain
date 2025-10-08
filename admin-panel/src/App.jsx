/**
 * GigChain Admin Panel - Main Application
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAdminStore } from './store/adminStore';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ContractsPage from './pages/ContractsPage';
import DisputesPage from './pages/DisputesPage';
import MarketplacePage from './pages/MarketplacePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import SettingsPage from './pages/SettingsPage';

// Layout
import AdminLayout from './components/Layout/AdminLayout';

function App() {
  const { isAuthenticated, verifySession } = useAdminStore();

  useEffect(() => {
    // Verify session on mount
    verifySession();
  }, [verifySession]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/contracts" element={<ContractsPage />} />
                  <Route path="/disputes" element={<DisputesPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/activity" element={<ActivityLogPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </AdminLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
