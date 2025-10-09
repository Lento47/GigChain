import React, { useState } from 'react';
import { HelpCircle, BookOpen, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

// Inline styles
const styles = {
  view: {
    padding: '2rem',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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
  sections: {
    display: 'grid',
    gap: '2rem'
  },
  section: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '1px solid #475569',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#e2e8f0',
    margin: '0 0 1.5rem 0',
    fontWeight: '600'
  },
  quickLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  quickLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.5rem',
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none'
  },
  faqItem: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid #334155',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  faqQuestion: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    background: 'transparent',
    border: 'none',
    color: '#e2e8f0',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left'
  },
  faqAnswer: {
    padding: '0 1.5rem 1.5rem 1.5rem',
    color: '#94a3b8',
    lineHeight: '1.6'
  },
  contactBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.3)'
  }
};

const HelpView = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqItems = [
    {
      id: 'faq1',
      question: '¿Cómo conecto mi wallet a GigChain?',
      answer: 'Para conectar tu wallet, haz clic en el icono de wallet en la esquina superior derecha. Asegúrate de tener una extensión de wallet como MetaMask instalada y configurada en la red Mumbai Testnet.'
    },
    {
      id: 'faq2',
      question: '¿Qué es un AI Agent y cómo lo uso?',
      answer: 'Un AI Agent es una inteligencia artificial diseñada para automatizar tareas específicas, como negociar contratos o generar borradores. Puedes activarlos y configurarlos desde la sección "AI Agents" en el sidebar.'
    },
    {
      id: 'faq3',
      question: '¿Cómo puedo crear un nuevo contrato?',
      answer: 'Puedes crear un nuevo contrato desde la sección "Contratos" o utilizando una plantilla predefinida en la sección "Plantillas". Sigue los pasos para rellenar los detalles y desplegarlo en la blockchain.'
    },
    {
      id: 'faq4',
      question: '¿Qué redes blockchain soporta GigChain?',
      answer: 'Actualmente, GigChain soporta la red Mumbai Testnet para desarrollo y pruebas, y la red principal de Polygon para operaciones en vivo.'
    }
  ];

  const quickLinks = [
    { icon: BookOpen, label: 'Guía de Inicio', href: '#' },
    { icon: BookOpen, label: 'Contratos', href: '#' },
    { icon: BookOpen, label: 'AI Agents', href: '#' },
    { icon: BookOpen, label: 'Wallets', href: '#' },
    { icon: BookOpen, label: 'Pagos', href: '#' },
    { icon: BookOpen, label: 'Configuración', href: '#' }
  ];

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div style={styles.view}>
      <h1 style={styles.title}>Centro de Ayuda</h1>
      <p style={styles.subtitle}>Encuentra respuestas a tus preguntas y recursos útiles</p>

      <div style={styles.sections}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Enlaces Rápidos</h3>
          <div style={styles.quickLinks}>
            {quickLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <a key={index} href={link.href} style={styles.quickLink}>
                  <IconComponent size={24} />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Preguntas Frecuentes</h3>
          {faqItems.map(faq => (
            <div key={faq.id} style={styles.faqItem}>
              <button 
                style={styles.faqQuestion}
                onClick={() => toggleFaq(faq.id)}
              >
                {faq.question}
                {openFaq === faq.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openFaq === faq.id && (
                <div style={styles.faqAnswer}>
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>¿Necesitas más ayuda?</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
            Si no encuentras lo que buscas, nuestro equipo de soporte está aquí para ayudarte.
          </p>
          <button style={styles.contactBtn}>
            <MessageSquare size={20} />
            Contactar Soporte
          </button>
        </div>
      </div>
    </div>
  );
};

export { HelpView };
export default HelpView;