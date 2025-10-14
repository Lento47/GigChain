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
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPriceChangeModal, setShowPriceChangeModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [priceChangeReason, setPriceChangeReason] = useState('');

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

  // Fetch contracts with debounce
  const fetchContracts = useCallback(async (force = false) => {
    const now = Date.now();
    // Debounce: don't fetch if we fetched less than 1 second ago (unless forced)
    if (!force && now - lastFetchTime < 1000) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLastFetchTime(now);

      const params = new URLSearchParams();
      if (walletAddress) params.append('wallet_address', walletAddress);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (userRole !== 'all') params.append('role', userRole);

      const response = await fetch(`${API_BASE_URL}/api/contracts?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contracts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setContracts(data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError(err.message);
      // Don't clear contracts on error - keep them visible
    } finally {
      setLoading(false);
    }
  }, [walletAddress, filters.status, filters.category, userRole, lastFetchTime]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Removed mock data - using real API data only

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
        (contract.title || '').toLowerCase().includes(searchLower) ||
        (contract.id || '').toLowerCase().includes(searchLower)
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
    if (!amount || isNaN(amount)) return '0 USDC';
    // Manejar números muy grandes (notación científica)
    if (amount > 1e15) {
      return `${(amount / 1e18).toFixed(2)}M ${currency}`;
    }
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

  // Handle view contract details
  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setShowDetailsModal(true);
  };

  // Handle edit contract
  const handleEditContract = (contract) => {
    setSelectedContract(contract);
    setShowEditModal(true);
  };

  // Handle close modals
  const handleCloseModals = () => {
    setShowDetailsModal(false);
    setShowEditModal(false);
    setShowPriceChangeModal(false);
    setSelectedContract(null);
    setNewPrice('');
    setPriceChangeReason('');
  };

  // Handle request price change
  const handleRequestPriceChange = (contract) => {
    setSelectedContract(contract);
    setNewPrice(contract.amount.toString());
    setShowPriceChangeModal(true);
  };

  // Handle submit price change request
  const handleSubmitPriceChange = async () => {
    if (!newPrice || !priceChangeReason) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      // Aquí se enviaría la solicitud a la API
      const response = await fetch(`${API_BASE_URL}/api/contracts/${selectedContract.id}/price-change-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_amount: parseFloat(newPrice),
          reason: priceChangeReason,
          requester_wallet: walletAddress
        })
      });

      if (response.ok) {
        alert('Solicitud de cambio de precio enviada. Ambas partes deben aprobar el cambio.');
        handleCloseModals();
      } else {
        throw new Error('Error al enviar la solicitud');
      }
    } catch (error) {
      console.error('Error requesting price change:', error);
      alert('Error al enviar la solicitud de cambio de precio');
    }
  };

  if (loading) {
    return (
      <div className="contracts-table-loading">
        <div className="spinner"></div>
        <p>Cargando contratos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contracts-table-error">
        <h3>Error al cargar contratos</h3>
        <p>{error}</p>
        <button onClick={() => fetchContracts(true)} className="btn-retry">
          Reintentar
        </button>
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
          <button className="btn-icon" onClick={() => fetchContracts(true)} title="Actualizar">
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
                    <span title={contract.id}>{contract.id}</span>
                  </td>
                  <td className="contract-title">
                    <div>
                      <strong>{contract.title || 'Sin título'}</strong>
                      {contract.skills && Array.isArray(contract.skills) && contract.skills.length > 0 && (
                        <div className="skills-tags">
                          {contract.skills.slice(0, 2).map((skill, i) => (
                            <span key={i} className="skill-tag">{skill}</span>
                          ))}
                          {contract.skills.length > 2 && (
                            <span className="skill-tag more">+{contract.skills.length - 2}</span>
                          )}
                        </div>
                      )}
                      {contract.category && contract.category !== 'other' && (
                        <div className="skills-tags">
                          <span className="skill-tag category">{contract.category}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="contract-address" title={contract.client_address || 'No asignado'}>
                    <User size={14} />
                    {truncateAddress(contract.client_address)}
                  </td>
                  <td className="contract-address" title={contract.freelancer_address || 'No asignado'}>
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
                    <span 
                      className="category-badge"
                      title={contract.category === 'other' ? 'General' : contract.category || 'Sin categoría'}
                    >
                      {contract.category === 'other' ? 'General' : contract.category || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="contract-date">
                    <Clock size={14} />
                    {formatDate(contract.created_at)}
                  </td>
                  <td className="contract-actions">
                    <button 
                      className="btn-action" 
                      title="Ver detalles"
                      onClick={() => handleViewContract(contract)}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn-action" 
                      title="Editar"
                      onClick={() => handleEditContract(contract)}
                    >
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

      {/* Contract Details Modal */}
      {showDetailsModal && selectedContract && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles del Contrato</h3>
              <button className="modal-close" onClick={handleCloseModals}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="contract-details">
                <div className="detail-row">
                  <label>ID:</label>
                  <span>{selectedContract.id}</span>
                </div>
                <div className="detail-row">
                  <label>Título:</label>
                  <span>{selectedContract.title}</span>
                </div>
                <div className="detail-row">
                  <label>Descripción:</label>
                  <span>{selectedContract.description}</span>
                </div>
                <div className="detail-row">
                  <label>Cliente:</label>
                  <span>{selectedContract.client_address || 'No asignado'}</span>
                </div>
                <div className="detail-row">
                  <label>Freelancer:</label>
                  <span>{selectedContract.freelancer_address || 'No asignado'}</span>
                </div>
                <div className="detail-row">
                  <label>Monto:</label>
                  <span>{formatAmount(selectedContract.amount, selectedContract.currency)}</span>
                </div>
                <div className="detail-row">
                  <label>Estado:</label>
                  <span className={`status-badge status-${selectedContract.status}`}>
                    {statusConfig[selectedContract.status]?.label || selectedContract.status}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Categoría:</label>
                  <span>{selectedContract.category === 'other' ? 'General' : selectedContract.category || 'Sin categoría'}</span>
                </div>
                <div className="detail-row">
                  <label>Creado:</label>
                  <span>{formatDate(selectedContract.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseModals}>
                Cerrar
              </button>
              <button className="btn-primary" onClick={() => handleEditContract(selectedContract)}>
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Edit Modal */}
      {showEditModal && selectedContract && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Contrato</h3>
              <button className="modal-close" onClick={handleCloseModals}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="form-group">
                  <label>Título:</label>
                  <input 
                    type="text" 
                    defaultValue={selectedContract.title}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Descripción:</label>
                  <textarea 
                    defaultValue={selectedContract.description}
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>Monto:</label>
                  <div className="price-display">
                    <span className="current-price">{formatAmount(selectedContract.amount, selectedContract.currency)}</span>
                    <span className="price-note">⚠️ El precio no puede cambiarse sin aprobación de ambas partes</span>
                    <button 
                      type="button"
                      className="btn-price-change"
                      onClick={() => handleRequestPriceChange(selectedContract)}
                    >
                      Solicitar Cambio de Precio
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Estado:</label>
                  <select defaultValue={selectedContract.status} className="form-select">
                    <option value="draft">Borrador</option>
                    <option value="open">Abierto</option>
                    <option value="pending">Pendiente</option>
                    <option value="active">Activo</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="review">Revisión</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="disputed">Disputado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoría:</label>
                  <select defaultValue={selectedContract.category} className="form-select">
                    <option value="development">Desarrollo</option>
                    <option value="design">Diseño</option>
                    <option value="marketing">Marketing</option>
                    <option value="writing">Escritura</option>
                    <option value="consulting">Consultoría</option>
                    <option value="other">General</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseModals}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={() => {
                // TODO: Implementar actualización del contrato
                alert('Función de actualización en desarrollo');
                handleCloseModals();
              }}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Change Request Modal */}
      {showPriceChangeModal && selectedContract && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Solicitar Cambio de Precio</h3>
              <button className="modal-close" onClick={handleCloseModals}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="price-change-form">
                <div className="price-info">
                  <h4>Información del Contrato</h4>
                  <p><strong>Contrato:</strong> {selectedContract.title}</p>
                  <p><strong>Precio Actual:</strong> {formatAmount(selectedContract.amount, selectedContract.currency)}</p>
                  <p><strong>Cliente:</strong> {truncateAddress(selectedContract.client_address)}</p>
                  <p><strong>Freelancer:</strong> {truncateAddress(selectedContract.freelancer_address)}</p>
                </div>
                
                <div className="form-group">
                  <label>Nuevo Precio (USDC):</label>
                  <input 
                    type="number" 
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="form-input"
                    placeholder="Ingresa el nuevo precio"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Motivo del Cambio:</label>
                  <textarea 
                    value={priceChangeReason}
                    onChange={(e) => setPriceChangeReason(e.target.value)}
                    className="form-textarea"
                    rows="4"
                    placeholder="Explica por qué necesitas cambiar el precio..."
                  />
                </div>

                <div className="price-change-warning">
                  <h4>⚠️ Importante</h4>
                  <ul>
                    <li>El cambio de precio requiere la aprobación de AMBAS partes</li>
                    <li>Se enviará una notificación al cliente y freelancer</li>
                    <li>El contrato se pausará hasta que ambas partes aprueben</li>
                    <li>Si una parte rechaza, el precio permanecerá igual</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseModals}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSubmitPriceChange}>
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsTable;

