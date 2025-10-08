import React from 'react';
import { FileText } from 'lucide-react';

const ContractsPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1><FileText size={32} /> Contracts Management</h1>
        <p>View and manage all platform contracts</p>
      </div>
      <div className="coming-soon">
        <p>View all contracts, filter by status, and manage contract disputes</p>
      </div>
    </div>
  );
};

export default ContractsPage;
