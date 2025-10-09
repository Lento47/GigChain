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
        <div className="header-info">
          <h1>Centro de Ayuda</h1>
          <p>Encuentra respuestas y recursos útiles</p>
        </div>
      </div>

      <div className="help-content">
        <div className="search-section">
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="¿En qué podemos ayudarte?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="resources-grid">
          {resources.map((resource, index) => (
            <a key={index} href={resource.link} className="resource-card">
              <div className="resource-icon">{resource.icon}</div>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <ExternalLink size={16} className="external-icon" />
            </a>
          ))}
        </div>

        <div className="faqs-section">
          <h2>Preguntas Frecuentes</h2>
          <div className="faqs-list">
            {filteredFaqs.map(faq => (
              <details key={faq.id} className="faq-item">
                <summary className="faq-question">
                  <HelpCircle size={20} />
                  <span>{faq.question}</span>
                </summary>
                <div className="faq-answer">
                  <span className="faq-category">{faq.category}</span>
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {filteredFaqs.length === 0 && (
          <div className="no-results">
            <HelpCircle size={48} />
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
});

HelpView.displayName = 'HelpView';

export { HelpView };
export default HelpView;
