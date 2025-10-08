import React from 'react';
import { AlertCircle } from 'lucide-react';

const DisputesPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1><AlertCircle size={32} /> Disputes Management</h1>
        <p>Monitor and manage platform disputes</p>
      </div>
      <div className="coming-soon">
        <p>View all disputes, review evidence, and monitor resolution progress</p>
      </div>
    </div>
  );
};

export default DisputesPage;
