import React, { useState } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Search, Filter, Download } from 'lucide-react';

// Inline styles
const styles = {
  view: {
    padding: '2rem',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    marginBottom: '2rem'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    padding: '2rem',
    borderRadius: '16px',
    border: '1px solid #475569',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    margin: '0'
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
  },
  content: {
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '20px',
    padding: '2rem',
    border: '1px solid #334155'
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },
  searchContainer: {
    position: 'relative',
    flex: '1',
    minWidth: '300px'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    zIndex: '1'
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid #475569',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontSize: '1rem',
    transition: 'all 0.3s ease'
  },
  table: {
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #334155',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gap: '1rem',
    padding: '1.5rem 2rem',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderBottom: '2px solid #475569'
  },
  tableCell: {
    fontWeight: '600',
    color: '#e2e8f0',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gap: '1rem',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #334155',
    transition: 'all 0.3s ease',
    alignItems: 'center'
  },
  noData: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#64748b'
  }
};

const TransactionsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="status-icon completed" />;
      case 'pending': return <Clock size={16} className="status-icon pending" />;
      case 'failed': return <XCircle size={16} className="status-icon failed" />;
      default: return <Clock size={16} className="status-icon" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment': return <ArrowUpRight size={16} className="type-icon payment" />;
      case 'receipt': return <ArrowDownLeft size={16} className="type-icon receipt" />;
      default: return <CreditCard size={16} className="type-icon" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleExportTransactions = () => {
    console.log('Exporting transactions');
    // Implementar lógica de exportación
  };

  const handleViewDetails = (transaction) => {
    console.log('Viewing transaction details:', transaction);
    // Implementar modal de detalles
  };

  return (
    <div style={styles.view}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Transacciones</h1>
            <p style={styles.subtitle}>Historial completo de pagos y recibos</p>
          </div>
          <div>
            <button 
              style={styles.exportBtn}
              onClick={handleExportTransactions}
            >
              <Download size={20} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.filters}>
          <div style={styles.searchContainer}>
            <Search size={20} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '2px solid #475569',
                borderRadius: '12px',
                color: '#e2e8f0',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completadas</option>
              <option value="pending">Pendientes</option>
              <option value="failed">Fallidas</option>
            </select>
          </div>
        </div>

        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <div style={styles.tableCell}>Tipo</div>
            <div style={styles.tableCell}>Estado</div>
            <div style={styles.tableCell}>Cantidad</div>
            <div style={styles.tableCell}>Descripción</div>
            <div style={styles.tableCell}>Fecha</div>
            <div style={styles.tableCell}>Acciones</div>
          </div>

          {filteredTransactions.map((transaction, index) => (
            <div key={index} style={styles.tableRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getTypeIcon(transaction.type)}
                <span style={{ color: '#e2e8f0', fontWeight: '600' }}>
                  {transaction.type === 'payment' ? 'Pago' : 'Recibo'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusIcon(transaction.status)}
                <span style={{ 
                  color: transaction.status === 'completed' ? '#10b981' : 
                         transaction.status === 'pending' ? '#f59e0b' : '#ef4444',
                  fontWeight: '600'
                }}>
                  {transaction.status === 'completed' ? 'Completada' : 
                   transaction.status === 'pending' ? 'Pendiente' : 'Fallida'}
                </span>
              </div>
              
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '1rem' }}>
                  {transaction.amount}
                </span>
              </div>
              
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: '500' }}>
                  {transaction.description}
                </span>
              </div>
              
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {transaction.timestamp}
                </span>
              </div>
              
              <div>
                <button 
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewDetails(transaction)}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div style={styles.noData}>
            <CreditCard size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#94a3b8' }}>No se encontraron transacciones</h3>
            <p style={{ margin: '0', fontSize: '1rem' }}>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { TransactionsView };
export default TransactionsView;
