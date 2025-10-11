import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Filter, Search, Download, RefreshCw, Eye, Edit, 
  Trash2, Clock, DollarSign, User, CheckCircle, XCircle, 
  AlertCircle, Play, Pause
} from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';
import './ContractsTable.css';

const ContractsTable = ({ walletAddress, userRole = 'all' }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Status badges configuration
  const statusConfig = {
    draft: { label: 'Borrador', color: 'gray', icon: Edit },
    open: { label: 'Abierto', color: 'blue', icon: Eye },
    pending: { label: 'Pendiente', color: 'yellow', icon: Clock },
    active: { label: 'Activo', color: 'green', icon: Play },
    in_progress: { label: 'En Progreso', color: 'purple', icon: Play },
    review: { label: 'Revisión', color: 'orange', icon: Eye },
    completed: { label: 'Completado', color: 'success', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'gray', icon: XCircle },
    disputed: { label: 'Disputado', color: 'red', icon: AlertCircle }
  };

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (walletAddress) params.append('wallet_address', walletAddress);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (userRole !== 'all') params.append('role', userRole);

      const response = await fetch(`${API_BASE_URL}/api/contracts?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }

      const data = await response.json();
      setContracts(data);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError(err.message);
      // Show mock data if backend fails
      setContracts(getMockContracts());
    } finally {
      setLoading(false);
    }
  }, [walletAddress, filters.status, filters.category, userRole]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Mock data for development
  const getMockContracts = () => [
    {
      id: 'CNT-001',
      title: 'Desarrollo de E-commerce con React',
      client_address: '0x1234...5678',
      freelancer_address: '0x8765...4321',
      amount: 4500,
      currency: 'USDC',
      status: 'active',
      category: 'development',
      deadline: '2025-11-15',
      created_at: '2025-10-01T10:00:00Z',
      skills: ['React', 'Node.js', 'MongoDB']
    },
    {
      id: 'CNT-002',
      title: 'Diseño UI/UX para App Móvil',
      client_address: '0x1234...5678',
      freelancer_address: null,
      amount: 2500,
      currency: 'USDC',
      status: 'open',
      category: 'design',
      deadline: '2025-10-25',
      created_at: '2025-10-05T14:30:00Z',
      skills: ['Figma', 'UI/UX', 'Prototyping']
    },
    {
      id: 'CNT-003',
      title: 'Consultoría de Seguridad Cloud',
      client_address: '0x9999...0000',
      freelancer_address: '0x1234...5678',
      amount: 6000,
      currency: 'USDC',
      status: 'completed',
      category: 'consulting',
      deadline: '2025-09-30',
      created_at: '2025-09-01T09:00:00Z',
      skills: ['AWS', 'Security', 'DevOps']
    }
  ];

  // Sort contracts
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedContracts = [...contracts].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter contracts
  const filteredContracts = sortedContracts.filter(contract => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        contract.title.toLowerCase().includes(searchLower) ||
        contract.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format amount
  const formatAmount = (amount, currency = 'USDC') => {
    return `${amount.toLocaleString('es-ES')} ${currency}`;
  };

  // Truncate address
  const truncateAddress = (address) => {
    if (!address) return 'No asignado';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Título', 'Cliente', 'Freelancer', 'Monto', 'Estado', 'Categoría', 'Creado'];
    const rows = filteredContracts.map(c => [
      c.id,
      c.title,
      truncateAddress(c.client_address),
      truncateAddress(c.freelancer_address),
      c.amount,
      c.status,
      c.category,
      formatDate(c.created_at)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="contracts-table-loading">
        <div className="spinner"></div>
        <p>Cargando contratos...</p>
      </div>
    );
  }

  return (
    <div className="contracts-table-container">
      {/* Header */}
      <div className="table-header">
        <div className="header-left">
          <FileText size={24} className="header-icon" />
          <div>
            <h2>Contratos y Trabajos</h2>
            <p>{filteredContracts.length} contratos encontrados</p>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-icon" onClick={fetchContracts} title="Actualizar">
            <RefreshCw size={18} />
          </button>
          <button className="btn-icon" onClick={exportToCSV} title="Exportar CSV">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="table-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por título o ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="active">Activo</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="filter-select"
        >
          <option value="">Todas las categorías</option>
          <option value="development">Desarrollo</option>
          <option value="design">Diseño</option>
          <option value="marketing">Marketing</option>
          <option value="writing">Escritura</option>
          <option value="consulting">Consultoría</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="contracts-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>
                ID
                <span className="sort-indicator"></span>
              </th>
              <th onClick={() => handleSort('title')}>
                Título
                <span className="sort-indicator"></span>
              </th>
              <th>Cliente</th>
              <th>Freelancer</th>
              <th onClick={() => handleSort('amount')}>
                Monto
                <span className="sort-indicator"></span>
              </th>
              <th>Estado</th>
              <th>Categoría</th>
              <th onClick={() => handleSort('created_at')}>
                Creado
                <span className="sort-indicator"></span>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract) => {
              const StatusIcon = statusConfig[contract.status]?.icon || FileText;
              
              return (
                <tr key={contract.id}>
                  <td className="contract-id">
                    <FileText size={16} />
                    <span>{contract.id}</span>
                  </td>
                  <td className="contract-title">
                    <div>
                      <strong>{contract.title}</strong>
                      {contract.skills && contract.skills.length > 0 && (
                        <div className="skills-tags">
                          {contract.skills.slice(0, 2).map((skill, i) => (
                            <span key={i} className="skill-tag">{skill}</span>
                          ))}
                          {contract.skills.length > 2 && (
                            <span className="skill-tag more">+{contract.skills.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="contract-address">
                    <User size={14} />
                    {truncateAddress(contract.client_address)}
                  </td>
                  <td className="contract-address">
                    <User size={14} />
                    {truncateAddress(contract.freelancer_address)}
                  </td>
                  <td className="contract-amount">
                    <DollarSign size={14} />
                    {formatAmount(contract.amount, contract.currency)}
                  </td>
                  <td>
                    <span className={`status-badge status-${contract.status}`}>
                      <StatusIcon size={14} />
                      {statusConfig[contract.status]?.label || contract.status}
                    </span>
                  </td>
                  <td>
                    <span className="category-badge">{contract.category}</span>
                  </td>
                  <td className="contract-date">
                    <Clock size={14} />
                    {formatDate(contract.created_at)}
                  </td>
                  <td className="contract-actions">
                    <button className="btn-action" title="Ver detalles">
                      <Eye size={16} />
                    </button>
                    <button className="btn-action" title="Editar">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredContracts.length === 0 && (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No hay contratos</h3>
          <p>No se encontraron contratos con los filtros seleccionados</p>
        </div>
      )}
    </div>
  );
};

export default ContractsTable;

