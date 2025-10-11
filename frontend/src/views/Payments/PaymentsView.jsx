import React, { useState, useMemo, useCallback } from 'react';
import { CreditCard, Send, Download, Plus, Search, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import './Payments.css';

const PaymentsView = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const stats = [
    { label: 'Total Pagado', value: '$12,450', icon: <Send size={24} />, color: '#10b981' },
    { label: 'Total Recibido', value: '$18,320', icon: <Download size={24} />, color: '#3b82f6' },
    { label: 'Pendiente', value: '$2,150', icon: <Clock size={24} />, color: '#f59e0b' }
  ];

  const payments = [
    {
      id: 1,
      type: 'sent',
      amount: '$1,500',
      recipient: '0x1234...5678',
      status: 'completed',
      date: '2024-01-15',
      description: 'Pago por desarrollo web'
    },
    {
      id: 2,
      type: 'received',
      amount: '$800',
      recipient: '0x9876...5432',
      status: 'completed',
      date: '2024-01-14',
      description: 'Pago por diseño UI/UX'
    },
    {
      id: 3,
      type: 'sent',
      amount: '$2,200',
      recipient: '0x5555...3333',
      status: 'pending',
      date: '2024-01-13',
      description: 'Pago por consultoría'
    }
  ];

  const filteredPayments = useMemo(() => {
    return payments.filter(payment =>
      payment.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      payment.recipient.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [payments, debouncedSearchTerm]);

  const handleNewPayment = useCallback(() => {
    alert('Nueva funcionalidad de pago. Se abrirá un modal en producción.');
  }, []);

  return (
    <div className="payments-view">
      <div className="view-header">
        <div className="header-content">
          <div className="header-info">
            <h1>💰 Pagos y Transacciones</h1>
            <p>Gestiona tus pagos, cobros y transacciones de forma segura</p>
          </div>
          <button className="new-payment-btn" onClick={handleNewPayment}>
            <Plus size={20} />
            <span>Nuevo Pago</span>
          </button>
        </div>
      </div>

      <div className="payments-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="payments-content">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por descripción, destinatario o monto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="payments-list">
          {filteredPayments.map(payment => (
            <div key={payment.id} className={`payment-item ${payment.type}`}>
              <div className={`payment-icon ${payment.type}`}>
                {payment.type === 'sent' ? <Send size={22} /> : <Download size={22} />}
              </div>
              <div className="payment-details">
                <h4>{payment.description}</h4>
                <div className="payment-meta">
                  <span className="payment-recipient">{payment.recipient}</span>
                  <span className="payment-date">{payment.date}</span>
                </div>
              </div>
              <div className="payment-right">
                <div className={`payment-amount ${payment.type}`}>
                  {payment.type === 'sent' ? '-' : '+'}{payment.amount}
                </div>
                <div className={`payment-status ${payment.status}`}>
                  {payment.status === 'completed' ? (
                    <><CheckCircle size={16} /> Completado</>
                  ) : (
                    <><Clock size={16} /> Pendiente</>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <div className="no-payments">
            <CreditCard size={64} className="no-payments-icon" />
            <h3>No se encontraron pagos</h3>
            <p>Intenta ajustar los filtros de búsqueda o crea un nuevo pago</p>
          </div>
        )}
      </div>
    </div>
  );
});

PaymentsView.displayName = 'PaymentsView';

export { PaymentsView };
export default PaymentsView;
