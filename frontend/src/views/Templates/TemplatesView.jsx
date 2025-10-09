import React, { useState, useMemo, useCallback } from 'react';
import { FileText, Copy, Plus, Search, Filter, Code } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import './Templates.css';

const TemplatesView = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Debounce search term to reduce re-renders
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  // Memoize categories to prevent recreation on every render
  const categories = useMemo(() => [
    { id: 'all', name: 'Todas' },
    { id: 'development', name: 'Desarrollo' },
    { id: 'design', name: 'Diseño' },
    { id: 'consulting', name: 'Consultoría' },
    { id: 'marketing', name: 'Marketing' }
  ], []);

  // Memoize filtered templates to only recalculate when dependencies change
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, debouncedSearchTerm, selectedCategory]);

  // Memoize event handlers to prevent recreation
  const handleUseTemplate = useCallback(async (template) => {
    try {
      // Navigate to contract creation with template pre-filled
      alert(`Plantilla "${template.name}" seleccionada. Esta funcionalidad abrirá el creador de contratos con los datos pre-cargados.`);
      // En producción, esto navegaría a la página de creación de contratos
      // history.push('/contracts/new', { template });
    } catch (error) {
      console.error('Error using template:', error);
      alert('Error al cargar la plantilla. Por favor, intenta de nuevo.');
    }
  }, []);

  const handleCreateTemplate = useCallback(() => {
    try {
      // Navigate to template creation form
      alert('Creación de plantilla personalizada. Esta funcionalidad abrirá un formulario de creación.');
      // En producción, esto navegaría a la página de creación
      // history.push('/templates/new');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error al abrir el creador de plantillas. Por favor, intenta de nuevo.');
    }
  }, []);

  return (
    <div className="templates-view">
      <div className="view-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Plantillas de Contratos</h1>
            <p>Plantillas predefinidas para acelerar la creación de contratos</p>
          </div>
          <div>
            <button 
              className="create-template-btn"
              onClick={handleCreateTemplate}
            >
              <Plus size={20} />
              Nueva Plantilla
            </button>
          </div>
        </div>
      </div>

      <div className="templates-content">
        <div className="templates-filters">
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <Filter size={20} className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <div className="template-icon">
                  <FileText size={24} />
                </div>
                <div className="template-info">
                  <h3 className="template-name">{template.name}</h3>
                  <p className="template-description">{template.description}</p>
                </div>
              </div>

              <div className="template-details">
                <div className="detail-item">
                  <span className="detail-label">Complejidad:</span>
                  <span className="detail-value">{template.complexity}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tiempo:</span>
                  <span className="detail-value">{template.estimatedTime}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Precio:</span>
                  <span className="detail-value">{template.price}</span>
                </div>
              </div>

              <div className="template-tags">
                {template.tags.map((tag, index) => (
                  <span key={index} className="template-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="template-actions">
                <button 
                  className="use-template-btn"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Code size={16} />
                  Usar Plantilla
                </button>
                <button className="copy-template-btn">
                  <Copy size={16} />
                  Copiar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="no-templates">
            <FileText size={48} className="no-templates-icon" />
            <h3>No se encontraron plantillas</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
});

TemplatesView.displayName = 'TemplatesView';

export { TemplatesView };
export default TemplatesView;
