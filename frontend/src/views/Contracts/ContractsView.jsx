import React, { useState } from 'react';
import { Plus, FileText, BarChart3 } from 'lucide-react';
import ContractsTable from './ContractsTable';
import { useWallet } from '../../hooks/useWallet';
import './Contracts.css';

const ContractsView = () => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [userRole, setUserRole] = useState('all'); // 'all', 'freelancer', 'client'
  const { address } = useWallet();

  return (
    <div className="contracts-view">
      {/* Header */}
      <div className="view-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Gestión de Contratos</h1>
            <p>Administra todos tus contratos y trabajos en un solo lugar</p>
          </div>
          <div className="header-actions">
            <button className="btn-create">
              <Plus size={20} />
              Nuevo Contrato
            </button>
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="role-selector">
        <button 
          className={`role-btn ${userRole === 'all' ? 'active' : ''}`}
          onClick={() => setUserRole('all')}
        >
          <BarChart3 size={18} />
          <span>Todos</span>
        </button>
        <button 
          className={`role-btn ${userRole === 'freelancer' ? 'active' : ''}`}
          onClick={() => setUserRole('freelancer')}
        >
          <span className="btn-emoji">👨‍💻</span>
          <span>Como Freelancer</span>
        </button>
        <button 
          className={`role-btn ${userRole === 'client' ? 'active' : ''}`}
          onClick={() => setUserRole('client')}
        >
          <span className="btn-emoji">🏢</span>
          <span>Como Cliente</span>
        </button>
      </div>

      {/* Table */}
      <ContractsTable walletAddress={address} userRole={userRole} />
    </div>
  );
};

export default ContractsView;

