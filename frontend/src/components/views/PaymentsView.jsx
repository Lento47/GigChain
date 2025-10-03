import React, { useState } from 'react';
import { CreditCard, Send, Download, Plus, Search, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';

// Inline styles
const styles = {
  view: {
    padding: '2rem',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    margin: '0 0 2rem 0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  card: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '1px solid #475569',
    borderRadius: '16px',
    padding: '1.5rem',
    transition: 'all 0.3s ease'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#e2e8f0',
    margin: '0 0 1rem 0'
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#e2e8f0'
  }
};

const PaymentsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const payments = [
    {
      id: 'PAY-001',
      recipient: 'Juan Pérez',
      amount: '150.00',
      currency: 'USDC',
      status: 'completed',
      description: 'Pago por servicios de desarrollo',
      timestamp: '2023-10-26 14:30'
    },
    {
      id: 'PAY-002',
      recipient: 'María García',
      amount: '75.50',
      currency: 'USDC',
      status: 'pending',
      description: 'Pago por diseño web',
      timestamp: '2023-10-26 10:15'
    },
    {
      id: 'PAY-003',
      recipient: 'Carlos López',
      amount: '200.00',
      currency: 'USDC',
      status: 'failed',
      description: 'Pago por consultoría',
      timestamp: '2023-10-25 16:45'
    }
  ];

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportPayments = () => {
    console.log('Exporting payments');
  };

  return (
    <div style={styles.view}>
      <h1 style={styles.title}>Gestión de Pagos</h1>
      <p style={styles.subtitle}>Sistema de pagos y transferencias</p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total Enviado</h3>
          <div style={styles.cardValue}>1,250.00 USDC</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total Recibido</h3>
          <div style={styles.cardValue}>2,850.00 USDC</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Pagos Pendientes</h3>
          <div style={styles.cardValue}>3</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Pagos Completados</h3>
          <div style={styles.cardValue}>15</div>
        </div>
      </div>

      <div style={{
        background: 'rgba(15, 23, 42, 0.5)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid #334155'
      }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Historial de Pagos</h3>
        
        {filteredPayments.map((payment, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            border: '1px solid #334155'
          }}>
            <div>
              <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{payment.recipient}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{payment.description}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#e2e8f0', fontWeight: '700' }}>{payment.amount} {payment.currency}</div>
              <div style={{ 
                color: payment.status === 'completed' ? '#10b981' : 
                       payment.status === 'pending' ? '#f59e0b' : '#ef4444',
                fontSize: '0.9rem'
              }}>
                {payment.status === 'completed' ? 'Completado' : 
                 payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
              </div>
            </div>
          </div>
        ))}

        {filteredPayments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <CreditCard size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#94a3b8' }}>No se encontraron pagos</h3>
            <p style={{ margin: '0', fontSize: '1rem' }}>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { PaymentsView };
export default PaymentsView;