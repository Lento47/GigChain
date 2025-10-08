import React from 'react';
import { Store } from 'lucide-react';

const MarketplacePage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Store size={32} /> Marketplace Management</h1>
        <p>Manage template marketplace and listings</p>
      </div>
      <div className="coming-soon">
        <p>View all templates, moderate listings, and manage marketplace settings</p>
      </div>
    </div>
  );
};

export default MarketplacePage;
