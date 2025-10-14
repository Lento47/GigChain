import React, { useState } from 'react';
import { X, FileText, DollarSign, Calendar, User, Briefcase, Zap, CheckCircle } from 'lucide-react';
import './ContractCreateModal.css';

const ContractCreateModal = ({ isOpen, onClose, onCreateContract, userRole = 'freelancer', walletAddress = null }) => {
  const [formData, setFormData] = useState({
    // Información básica del proyecto
    projectTitle: '',
    projectDescription: '',
    category: 'desarrollo-web',
    
    // Información financiera
    budgetType: 'fixed', // 'fixed' o 'hourly'
    fixedBudget: '',
    hourlyRate: '',
    estimatedHours: '',
    
    // Tiempo y entrega
    projectDuration: '',
    deadline: '',
    
    // Habilidades y requisitos
    requiredSkills: '',
    experienceLevel: 'intermedio',
    
    // Información del usuario
    role: userRole,
    
    // Entregables
    deliverables: '',
    milestones: '',
    
    // Información adicional
    additionalRequirements: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'desarrollo-web', label: 'Desarrollo Web' },
    { value: 'diseno-grafico', label: 'Diseño Gráfico' },
    { value: 'marketing-digital', label: 'Marketing Digital' },
    { value: 'redaccion', label: 'Redacción y Contenido' },
    { value: 'traduccion', label: 'Traducción' },
    { value: 'consultoria', label: 'Consultoría' },
    { value: 'otros', label: 'Otros' }
  ];

  const experienceLevels = [
    { value: 'principiante', label: 'Principiante (0-2 años)' },
    { value: 'intermedio', label: 'Intermedio (2-5 años)' },
    { value: 'avanzado', label: 'Avanzado (5+ años)' },
    { value: 'experto', label: 'Experto (10+ años)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Determinar el tipo de contrato según el rol
      const contractType = formData.role === 'client' ? 'project' : 'service';
      
      // Construir el texto del contrato basado en los datos del formulario
      const contractText = buildContractText(formData);
      
      // Preparar datos para el endpoint estructurado
      const structuredData = {
        description: formData.projectDescription,
        offeredAmount: contractType === 'service' && formData.budgetType === 'fixed' ? 
          parseFloat(formData.fixedBudget) : 
          (formData.budgetType === 'hourly' && formData.hourlyRate ? 
            parseFloat(formData.hourlyRate) * parseFloat(formData.estimatedHours || 40) : null),
        requestedAmount: contractType === 'project' && formData.budgetType === 'fixed' ? 
          parseFloat(formData.fixedBudget) : null,
        days: formData.projectDuration ? parseInt(formData.projectDuration) : null,
        role: formData.role,
        contractType: contractType,
        freelancerWallet: formData.role === 'freelancer' ? walletAddress : null,
        clientWallet: formData.role === 'client' ? walletAddress : null,
        
        // Información adicional del formulario
        category: formData.category,
        projectTitle: formData.projectTitle,
        budgetType: formData.budgetType,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        requiredSkills: formData.requiredSkills,
        experienceLevel: formData.experienceLevel,
        deliverables: formData.deliverables,
        milestones: formData.milestones,
        additionalRequirements: formData.additionalRequirements,
        deadline: formData.deadline
      };
      
      // Llamar a la función de creación con los datos estructurados
      await onCreateContract(structuredData);
      
      // Resetear formulario y cerrar modal
      setFormData({
        projectTitle: '',
        projectDescription: '',
        category: 'desarrollo-web',
        budgetType: 'fixed',
        fixedBudget: '',
        hourlyRate: '',
        estimatedHours: '',
        projectDuration: '',
        deadline: '',
        requiredSkills: '',
        experienceLevel: 'intermedio',
        role: userRole,
        deliverables: '',
        milestones: '',
        additionalRequirements: ''
      });
      setCurrentStep(1);
      onClose();
      
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildContractText = (data) => {
    let text = `Proyecto: ${data.projectTitle}\n\n`;
    text += `Descripción: ${data.projectDescription}\n\n`;
    text += `Categoría: ${categories.find(c => c.value === data.category)?.label || data.category}\n\n`;
    
    // Presupuesto
    if (data.budgetType === 'fixed' && data.fixedBudget) {
      text += `Presupuesto fijo: $${data.fixedBudget} USD\n`;
    } else if (data.budgetType === 'hourly' && data.hourlyRate) {
      text += `Tarifa por hora: $${data.hourlyRate} USD/hora\n`;
      if (data.estimatedHours) {
        text += `Horas estimadas: ${data.estimatedHours} horas\n`;
      }
    }
    
    // Tiempo
    if (data.projectDuration) {
      text += `Duración del proyecto: ${data.projectDuration} días\n`;
    }
    if (data.deadline) {
      text += `Fecha límite: ${data.deadline}\n`;
    }
    
    // Habilidades
    if (data.requiredSkills) {
      text += `\nHabilidades requeridas: ${data.requiredSkills}\n`;
    }
    text += `Nivel de experiencia requerido: ${experienceLevels.find(e => e.value === data.experienceLevel)?.label || data.experienceLevel}\n`;
    
    // Entregables
    if (data.deliverables) {
      text += `\nEntregables: ${data.deliverables}\n`;
    }
    if (data.milestones) {
      text += `Hitos del proyecto: ${data.milestones}\n`;
    }
    
    // Información adicional
    if (data.additionalRequirements) {
      text += `\nRequisitos adicionales: ${data.additionalRequirements}\n`;
    }
    
    text += `\nRol del usuario: ${data.role}`;
    text += `\nFecha de creación: ${new Date().toLocaleDateString()}`;
    
    return text;
  };

  const nextStep = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Next step clicked, current step:', currentStep);
    console.log('Is step valid:', isStepValid());
    
    // Verificar que el paso actual es válido antes de continuar
    if (!isStepValid()) {
      console.log('Step is not valid, cannot proceed');
      return;
    }
    
    if (currentStep < 3) {
      console.log('Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Previous step clicked, current step:', currentStep);
    if (currentStep > 1) {
      console.log('Moving to step:', currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = formData.projectTitle && formData.projectDescription && formData.category;
        console.log('Step 1 validation:', {
          projectTitle: formData.projectTitle,
          projectDescription: formData.projectDescription,
          category: formData.category,
          isValid
        });
        return isValid;
      case 2:
        isValid = formData.budgetType === 'hourly' 
          ? formData.hourlyRate 
          : formData.fixedBudget;
        console.log('Step 2 validation:', {
          budgetType: formData.budgetType,
          hourlyRate: formData.hourlyRate,
          fixedBudget: formData.fixedBudget,
          isValid
        });
        return isValid;
      case 3:
        return true; // Paso opcional
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      // Solo cerrar si se hace click en el overlay, no en el modal
      if (e.target === e.currentTarget) {
        console.log('Modal overlay clicked, closing modal');
        onClose();
      }
    }}>
      <div className="contract-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={24} />
            <h2>
              {userRole === 'client' ? 'Crear Proyecto' : 'Crear Servicio'}
            </h2>
          </div>
          <button className="close-button" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            onClose();
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>{userRole === 'client' ? 'Proyecto' : 'Servicio'}</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>{userRole === 'client' ? 'Presupuesto' : 'Precio'}</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Detalles</span>
          </div>
        </div>

        <form onSubmit={(e) => {
          console.log('Form submitted');
          handleSubmit(e);
        }} className="modal-form">
          {/* Paso 1: Información del Proyecto/Servicio */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>{userRole === 'client' ? 'Información del Proyecto' : 'Información del Servicio'}</h3>
              
              <div className="form-group">
                <label htmlFor="projectTitle">
                  {userRole === 'client' ? 'Título del Proyecto *' : 'Nombre del Servicio *'}
                </label>
                <input
                  type="text"
                  id="projectTitle"
                  value={formData.projectTitle}
                  onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                  placeholder={userRole === 'client' ? 
                    "Ej: Desarrollo de sitio web e-commerce" : 
                    "Ej: Desarrollo de aplicaciones web con React"}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="projectDescription">
                  {userRole === 'client' ? 'Descripción del Proyecto *' : 'Descripción del Servicio *'}
                </label>
                <textarea
                  id="projectDescription"
                  rows="4"
                  value={formData.projectDescription}
                  onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                  placeholder={userRole === 'client' ? 
                    "Describe detalladamente qué necesitas para tu proyecto..." :
                    "Describe qué servicios ofreces y tu experiencia..."}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoría *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Paso 2: Presupuesto/Precio y Tiempo */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>{userRole === 'client' ? 'Presupuesto y Tiempo' : 'Precio y Disponibilidad'}</h3>
              
              <div className="form-group">
                <label>
                  {userRole === 'client' ? 'Tipo de Presupuesto' : 'Estructura de Precio'}
                </label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="budgetType"
                      value="fixed"
                      checked={formData.budgetType === 'fixed'}
                      onChange={(e) => handleInputChange('budgetType', e.target.value)}
                    />
                    <DollarSign size={16} />
                    {userRole === 'client' ? 'Precio Fijo' : 'Precio por Proyecto'}
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="budgetType"
                      value="hourly"
                      checked={formData.budgetType === 'hourly'}
                      onChange={(e) => handleInputChange('budgetType', e.target.value)}
                    />
                    <Calendar size={16} />
                    {userRole === 'client' ? 'Por Horas' : 'Tarifa por Hora'}
                  </label>
                </div>
              </div>

              {formData.budgetType === 'fixed' ? (
                <div className="form-group">
                  <label htmlFor="fixedBudget">
                    {userRole === 'client' ? 'Presupuesto Total (USD) *' : 'Precio del Proyecto (USD) *'}
                  </label>
                  <input
                    type="number"
                    id="fixedBudget"
                    value={formData.fixedBudget}
                    onChange={(e) => handleInputChange('fixedBudget', e.target.value)}
                    placeholder={userRole === 'client' ? "1000" : "800"}
                    min="1"
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="hourlyRate">
                      {userRole === 'client' ? 'Presupuesto por Hora (USD) *' : 'Tu Tarifa por Hora (USD) *'}
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                      placeholder={userRole === 'client' ? "50" : "25"}
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="estimatedHours">Horas Estimadas</label>
                    <input
                      type="number"
                      id="estimatedHours"
                      value={formData.estimatedHours}
                      onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                      placeholder="20"
                      min="1"
                    />
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="projectDuration">Duración (días)</label>
                  <input
                    type="number"
                    id="projectDuration"
                    value={formData.projectDuration}
                    onChange={(e) => handleInputChange('projectDuration', e.target.value)}
                    placeholder="30"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="deadline">Fecha Límite</label>
                  <input
                    type="date"
                    id="deadline"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Detalles y Requisitos */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Detalles y Requisitos</h3>
              
              <div className="form-group">
                <label htmlFor="requiredSkills">
                  {userRole === 'client' ? 'Habilidades Requeridas' : 'Tus Habilidades'}
                </label>
                <input
                  type="text"
                  id="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={(e) => handleInputChange('requiredSkills', e.target.value)}
                  placeholder={userRole === 'client' ? 
                    "React, Node.js, MongoDB, CSS..." :
                    "React, Node.js, Python, UI/UX..."}
                />
              </div>

              <div className="form-group">
                <label htmlFor="experienceLevel">Nivel de Experiencia</label>
                <select
                  id="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="deliverables">
                  {userRole === 'client' ? 'Entregables Esperados' : 'Qué Incluyes en tu Servicio'}
                </label>
                <textarea
                  id="deliverables"
                  rows="3"
                  value={formData.deliverables}
                  onChange={(e) => handleInputChange('deliverables', e.target.value)}
                  placeholder={userRole === 'client' ? 
                    "Código fuente, documentación, pruebas..." :
                    "Código fuente, documentación, soporte post-entrega..."}
                />
              </div>

              <div className="form-group">
                <label htmlFor="milestones">Hitos del Proyecto</label>
                <textarea
                  id="milestones"
                  rows="3"
                  value={formData.milestones}
                  onChange={(e) => handleInputChange('milestones', e.target.value)}
                  placeholder="Diseño inicial (25%), Backend (50%), Frontend (75%), Testing (100%)..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="additionalRequirements">Requisitos Adicionales</label>
                <textarea
                  id="additionalRequirements"
                  rows="2"
                  value={formData.additionalRequirements}
                  onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                  placeholder="Comunicación diaria, reuniones semanales, código en inglés..."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="modal-actions">
            {currentStep > 1 && (
              <button type="button" className="btn-secondary" onClick={(e) => {
                console.log('Anterior button clicked');
                prevStep(e);
              }}>
                Anterior
              </button>
            )}
            
            {currentStep < 3 ? (
              <button 
                type="button" 
                className="btn-primary" 
                onClick={(e) => {
                  console.log('Siguiente button clicked');
                  nextStep(e);
                }}
                disabled={!isStepValid()}
              >
                Siguiente
                <Zap size={16} />
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn-create-contract" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    {userRole === 'client' ? 'Crear Proyecto' : 'Publicar Servicio'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractCreateModal;
