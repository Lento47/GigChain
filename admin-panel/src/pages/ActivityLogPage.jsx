import React from 'react';
import { Activity } from 'lucide-react';

const ActivityLogPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Activity size={32} /> Admin Activity Log</h1>
        <p>Audit log of all admin actions</p>
      </div>
      <div className="coming-soon">
        <p>View complete audit trail of all admin actions on the platform</p>
      </div>
    </div>
  );
};

export default ActivityLogPage;
