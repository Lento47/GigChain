import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Settings size={32} /> System Settings</h1>
        <p>Configure platform settings</p>
      </div>
      <div className="coming-soon">
        <p>Manage platform configuration, admin accounts, and system settings</p>
      </div>
    </div>
  );
};

export default SettingsPage;
