import React from 'react';
import { X, ExternalLink, TrendingUp, Clock, DollarSign, Building2, Sparkles, Briefcase } from 'lucide-react';
import './modal.css';

const JobsModal = ({ isOpen, onClose, selectedPeriod, userType }) => {
  if (!isOpen) return null;

  // Use jobs from selectedPeriod if available, otherwise fallback to sample data
  const jobs = selectedPeriod?.jobs || [
    {
      id: 1,
      title: "Desarrollo de E-commerce",
      company: "TechCorp",
      duration: "3 semanas",
      budget: "$4,500",
      tags: ["React", "Node.js", "MongoDB"],
      description: "Desarrollo completo de plataforma de comercio electrónico con sistema de pagos integrado",
      type: "Desarrollo Web",
      level: "Intermedio",
      rating: 4.8
    },
    {
      id: 2,
      title: "Consultoría IT",
      company: "TechConsult",
      duration: "2 semanas",
      budget: "$3,500",
      tags: ["Arquitectura", "Cloud", "Security"],
      description: "Auditoría de seguridad y optimización de sistemas en la nube",
      type: "Consultoría",
      level: "Senior",
      rating: 4.9
    },
    {
      id: 3,
      title: "Video Marketing",
      company: "VideoPro",
      duration: "2 semanas",
      budget: "$2,000",
      tags: ["After Effects", "Premiere", "Motion Graphics"],
      description: "Videos promocionales para redes sociales con animaciones personalizadas",
      type: "Marketing",
      level: "Intermedio",
      rating: 4.7
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="jobs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <Briefcase size={28} className="header-icon" />
            <div>
              <h3 className="modal-title">
                {selectedPeriod?.hour ? `Trabajos Disponibles - ${selectedPeriod.hour}` : 'Trabajos Disponibles'}
              </h3>
              <p className="modal-subtitle">
                {selectedPeriod?.hour 
                  ? `${selectedPeriod.openContracts || 0} contratos abiertos, ${selectedPeriod.acceptedContracts || 0} aceptados`
                  : 'Encuentra tu próxima oportunidad'
                }
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="jobs-summary">
            <div className="summary-card">
              <div className="summary-icon">
                <Sparkles size={32} />
              </div>
              <div className="summary-content">
                <h4>NUEVOS CONTRATOS</h4>
                <div className="summary-number">
                  <TrendingUp size={24} className="trend-icon" />
                  <span>+18</span>
                </div>
                <p>Oportunidades disponibles en este período</p>
              </div>
            </div>
          </div>

          <div className="jobs-grid">
            {jobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-level-badge">{job.level}</div>
                
                <div className="job-header">
                  <div className="job-title-section">
                    <h4 className="job-title">{job.title}</h4>
                    <div className="job-company">
                      <Building2 size={14} />
                      <span>{job.company}</span>
                    </div>
                  </div>
                </div>

                <div className="job-tags">
                  {job.tags.map((tag, index) => (
                    <span key={index} className="job-tag">{tag}</span>
                  ))}
                </div>

                <div className="job-description">
                  <p>{job.description}</p>
                </div>

                <div className="job-meta-row">
                  <div className="job-meta-item">
                    <Clock size={16} />
                    <span>{job.duration}</span>
                  </div>
                  <div className="job-meta-item budget">
                    <DollarSign size={16} />
                    <span>{job.budget}</span>
                  </div>
                </div>

                <div className="job-footer">
                  <div className="job-type-badge">{job.type}</div>
                  <button className="apply-btn">
                    <span>Aplicar</span>
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { JobsModal };
export default JobsModal;
