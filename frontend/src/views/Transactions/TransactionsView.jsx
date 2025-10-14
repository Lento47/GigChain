import React, { useState, useMemo, useCallback } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Search, Filter, Download } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import './Transactions.css';

const TransactionsView = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  
  // Debounce search for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const transactions = [
    {
      id: '0x1234...5678',
      type: 'payment',
      status: 'completed',
      amount: '1,500 USDC',
      from: '0x1234...5678',
      to: '0x9876...5432',
      timestamp: '2024-01-15 14:30:25',
      description: 'Pago por desarrollo web',
      gasUsed: '0.002 ETH',
      blockNumber: 12345678
    },
    {
      id: '0x2345...6789',
      type: 'receipt',
      status: 'completed',
      amount: '800 USDC',
      from: '0x9876...5432',
      to: '0x1234...5678',
      timestamp: '2024-01-14 09:15:42',
      description: 'Pago por diseño UI/UX',
      gasUsed: '0.001 ETH',
      blockNumber: 12345675
    },
    {
      id: '0x3456...7890',
      type: 'payment',
      status: 'pending',
      amount: '2,200 USDC',
      from: '0x1234...5678',
      to: '0x5555...3333',
      timestamp: '2024-01-13 16:45:18',
      description: 'Pago por consultoría técnica',
      gasUsed: '0.003 ETH',
      blockNumber: 12345670
    },
    {
      id: '0x4567...8901',
      type: 'receipt',
      status: 'failed',
      amount: '500 USDC',
      from: '0x7777...9999',
      to: '0x1234...5678',
      timestamp: '2024-01-12 11:20:35',
      description: 'Pago por marketing digital',
      gasUsed: '0.002 ETH',
      blockNumber: null
    }
  ];

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="status-icon completed" />;
      case 'pending': return <Clock size={16} className="status-icon pending" />;
      case 'failed': return <XCircle size={16} className="status-icon failed" />;
      default: return <Clock size={16} className="status-icon" />;
    }
  }, []);

  const getTypeIcon = useCallback((type) => {
    switch (type) {
      case 'payment': return <ArrowUpRight size={16} />;
      case 'receipt': return <ArrowDownLeft size={16} />;
      default: return <CreditCard size={16} />;
    }
  }, []);

  // Memoize filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           transaction.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           transaction.from.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           transaction.to.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      const matchesType = selectedType === 'all' || transaction.type === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [transactions, debouncedSearchTerm, selectedStatus, selectedType]);

  const handleExportTransactions = useCallback(() => {
    try {
      const dataStr = JSON.stringify(filteredTransactions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `transactions_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Error al exportar transacciones. Por favor, intenta de nuevo.');
    }
  }, [filteredTransactions]);

  const handleViewDetails = useCallback((transaction) => {
    try {
      alert(`Detalles de transacción:\nID: ${transaction.id}\nMonto: ${transaction.amount}\nEstado: ${transaction.status}\n\nEsta funcionalidad mostrará un modal detallado en producción.`);
    } catch (error) {
      console.error('Error viewing transaction details:', error);
      alert('Error al cargar detalles. Por favor, intenta de nuevo.');
    }
  }, []);

  return (
    <div className="transactions-view">
      {/* Action Bar */}
      <div className="action-bar">
        <div className="transactions-filters">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <Filter size={18} className="filter-icon" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Estados</option>
              <option value="completed">Completadas</option>
              <option value="pending">Pendientes</option>
              <option value="failed">Fallidas</option>
            </select>
          </div>

          <div className="filter-container">
            <Filter size={18} className="filter-icon" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tipos</option>
              <option value="payment">Pagos</option>
              <option value="receipt">Recibos</option>
            </select>
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            className="action-btn secondary"
            onClick={handleExportTransactions}
          >
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="transactions-content">

        <div className="transactions-table">
          <div className="table-header">
            <div className="table-cell">Tipo</div>
            <div className="table-cell">Estado</div>
            <div className="table-cell">Cantidad</div>
            <div className="table-cell">Descripción</div>
            <div className="table-cell">Fecha</div>
            <div className="table-cell">Acciones</div>
          </div>

          {filteredTransactions.map((transaction, index) => (
            <div key={index} className="table-row">
              <div className="table-cell type-info">
                <div className={`type-icon ${transaction.type}`}>
                  {getTypeIcon(transaction.type)}
                </div>
                <span className="type-text">{transaction.type === 'payment' ? 'Pago' : 'Recibo'}</span>
              </div>
              
              <div className="table-cell status-info">
                {getStatusIcon(transaction.status)}
                <span className={`status-text ${transaction.status}`}>
                  {transaction.status === 'completed' ? 'Completada' : 
                   transaction.status === 'pending' ? 'Pendiente' : 'Fallida'}
                </span>
              </div>
              
              <div className="table-cell">
                <span className="amount">{transaction.amount}</span>
              </div>
              
              <div className="table-cell">
                <span className="description">{transaction.description}</span>
              </div>
              
              <div className="table-cell">
                <span className="timestamp">{transaction.timestamp}</span>
              </div>
              
              <div className="table-cell">
                <button 
                  className="view-details-btn"
                  onClick={() => handleViewDetails(transaction)}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="no-transactions">
            <CreditCard size={48} className="no-transactions-icon" />
            <h3>No se encontraron transacciones</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
});

TransactionsView.displayName = 'TransactionsView';

export { TransactionsView };
export default TransactionsView;
