import React, { useState } from 'react';
import { FileText, Copy, Plus, Search, Filter, Code } from 'lucide-react';

// Inline styles to ensure they work
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
  headerInfo: {},
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
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
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '1px solid #475569',
    borderRadius: '16px',
    padding: '1.5rem',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  cardIcon: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: '0'
  },
  cardInfo: {
    flex: '1'
  },
  cardName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#e2e8f0',
    margin: '0 0 0.5rem 0'
  },
  cardDescription: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    margin: '0'
  },
  useBtn: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
  },
  filterContainer: {
    position: 'relative',
    minWidth: '200px'
  },
  filterIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    zIndex: '1'
  },
  filterSelect: {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid #475569',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  cardActions: {
    display: 'flex',
    gap: '0.75rem'
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#94a3b8',
    border: '1px solid #475569',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
};

const TemplatesView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates = [
    {
      id: 1,
      name: 'Contrato de Desarrollo Web',
      category: 'development',
      description: 'Plantilla estándar para proyectos de desarrollo web',
      complexity: 'Básico',
      estimatedTime: '2-4 semanas',
      price: '500-2000 USDC',
      tags: ['Web', 'Frontend', 'React']
    },
    {
      id: 2,
      name: 'Contrato de Diseño UI/UX',
      category: 'design',
      description: 'Plantilla para proyectos de diseño de interfaz',
      complexity: 'Intermedio',
      estimatedTime: '1-3 semanas',
      price: '300-1500 USDC',
      tags: ['UI', 'UX', 'Design']
    },
    {
      id: 3,
      name: 'Contrato de Consultoría',
      category: 'consulting',
      description: 'Plantilla para servicios de consultoría técnica',
      complexity: 'Avanzado',
      estimatedTime: 'Variable',
      price: '100-500 USDC/hora',
      tags: ['Consulting', 'Technical']
    },
    {
      id: 4,
      name: 'Contrato de Marketing Digital',
      category: 'marketing',
      description: 'Plantilla para servicios de marketing digital',
      complexity: 'Intermedio',
      estimatedTime: '1-6 meses',
      price: '1000-5000 USDC',
      tags: ['Marketing', 'SEO', 'Social Media']
    }
  ];

  const categories = [
    { id: 'all', name: 'Todas' },
    { id: 'development', name: 'Desarrollo' },
    { id: 'design', name: 'Diseño' },
    { id: 'consulting', name: 'Consultoría' },
    { id: 'marketing', name: 'Marketing' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template) => {
    try {
      // Navigate to contract creation with template pre-filled
      alert(`Plantilla "${template.name}" seleccionada. Esta funcionalidad abrirá el creador de contratos con los datos pre-cargados.`);
      // En producción, esto navegaría a la página de creación de contratos
      // history.push('/contracts/new', { template });
    } catch (error) {
      console.error('Error using template:', error);
      alert('Error al cargar la plantilla. Por favor, intenta de nuevo.');
    }
  };

  const handleCreateTemplate = () => {
    try {
      // Navigate to template creation form
      alert('Creación de plantilla personalizada. Esta funcionalidad abrirá un formulario de creación.');
      // En producción, esto navegaría a la página de creación
      // history.push('/templates/new');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error al abrir el creador de plantillas. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div style={styles.view}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>Plantillas de Contratos</h1>
            <p style={styles.subtitle}>Plantillas predefinidas para acelerar la creación de contratos</p>
          </div>
          <div>
            <button 
              style={styles.createBtn}
              onClick={handleCreateTemplate}
            >
              <Plus size={20} />
              Nueva Plantilla
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
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.filterContainer}>
            <Filter size={20} style={styles.filterIcon} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.filterSelect}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.grid}>
          {filteredTemplates.map(template => (
            <div key={template.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>
                  <FileText size={24} />
                </div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardName}>{template.name}</h3>
                  <p style={styles.cardDescription}>{template.description}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Complejidad:</span>
                  <span style={{ color: '#e2e8f0' }}>{template.complexity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Tiempo:</span>
                  <span style={{ color: '#e2e8f0' }}>{template.estimatedTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Precio:</span>
                  <span style={{ color: '#e2e8f0' }}>{template.price}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                {template.tags.map((tag, index) => (
                  <span key={index} style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid #475569',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    marginRight: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={styles.cardActions}>
                <button 
                  style={styles.useBtn}
                  onClick={() => handleUseTemplate(template)}
                >
                  <Code size={16} />
                  Usar Plantilla
                </button>
                <button style={styles.copyBtn}>
                  <Copy size={16} />
                  Copiar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <FileText size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#94a3b8' }}>No se encontraron plantillas</h3>
            <p style={{ margin: '0', fontSize: '1rem' }}>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { TemplatesView };
export default TemplatesView;
