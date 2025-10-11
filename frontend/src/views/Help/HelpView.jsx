import React, { useState, useMemo, useCallback } from 'react';
import { HelpCircle, Search, Book, MessageSquare, Mail, ExternalLink } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import './Help.css';

const HelpView = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: '¿Cómo creo mi primer contrato?',
      answer: 'Para crear tu primer contrato, ve a la sección "Plantillas", selecciona una plantilla adecuada y personaliza los términos según tus necesidades.'
    },
    {
      id: 2,
      category: 'Payments',
      question: '¿Cómo funcionan los pagos en escrow?',
      answer: 'Los fondos se bloquean en un smart contract hasta que ambas partes confirmen la finalización del trabajo, garantizando seguridad para todos.'
    },
    {
      id: 3,
      category: 'Security',
      question: '¿Es segura la plataforma?',
      answer: 'Sí, utilizamos smart contracts auditados, encriptación end-to-end y las mejores prácticas de seguridad blockchain.'
    },
    {
      id: 4,
      category: 'AI Agents',
      question: '¿Qué son los AI Agents?',
      answer: 'Los AI Agents son asistentes inteligentes que te ayudan a negociar términos, generar contratos y resolver disputas automáticamente.'
    },
    {
      id: 5,
      category: 'Wallets',
      question: '¿Qué wallets son compatibles?',
      answer: 'Soportamos MetaMask, WalletConnect y cualquier wallet compatible con Web3 para Polygon, Ethereum y Arbitrum.'
    }
  ];

  const resources = [
    { icon: <Book size={24} />, title: 'Documentación', description: 'Guías completas y tutoriales', link: '#' },
    { icon: <MessageSquare size={24} />, title: 'Comunidad', description: 'Únete a nuestro Discord', link: '#' },
    { icon: <Mail size={24} />, title: 'Soporte', description: 'Contacta a nuestro equipo', link: '#' }
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [faqs, debouncedSearchTerm]);

  return (
    <div className="help-view">
      <div className="view-header">
        <div className="header-content">
          <div className="header-info">
            <h1>🆘 Centro de Ayuda</h1>
            <p>Encuentra respuestas rápidas y recursos útiles para usar GigChain</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">5</span>
              <span className="stat-label">FAQs</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">3</span>
              <span className="stat-label">Recursos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="help-content">
        <div className="search-section">
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="¿En qué podemos ayudarte? Busca por preguntas, categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="resources-section">
          <div className="section-header">
            <h2>📚 Recursos Útiles</h2>
            <p>Accede a documentación, comunidad y soporte</p>
          </div>
          <div className="resources-grid">
            {resources.map((resource, index) => (
              <a key={index} href={resource.link} className="resource-card">
                <div className="resource-icon">{resource.icon}</div>
                <div className="resource-content">
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                </div>
                <ExternalLink size={18} className="external-icon" />
              </a>
            ))}
          </div>
        </div>

        <div className="faqs-section">
          <div className="section-header">
            <h2>❓ Preguntas Frecuentes</h2>
            <p>Respuestas rápidas a las dudas más comunes</p>
          </div>
          <div className="faqs-list">
            {filteredFaqs.map(faq => (
              <details key={faq.id} className="faq-item">
                <summary className="faq-question">
                  <div className="faq-icon">
                    <HelpCircle size={20} />
                  </div>
                  <div className="faq-content">
                    <h4>{faq.question}</h4>
                    <span className="faq-category">{faq.category}</span>
                  </div>
                </summary>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {filteredFaqs.length === 0 && (
          <div className="no-results">
            <HelpCircle size={64} className="no-results-icon" />
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otros términos de búsqueda o explora nuestras categorías</p>
          </div>
        )}
      </div>
    </div>
  );
});

HelpView.displayName = 'HelpView';

export { HelpView };
export default HelpView;
