import React from 'react';
import { X, ExternalLink } from 'lucide-react';

const JobsModal = ({ isOpen, onClose, selectedPeriod, userType }) => {
  if (!isOpen) return null;

  // Datos de ejemplo para trabajos disponibles
  const sampleJobs = [
    {
      id: 1,
      title: "Desarrollo de E-commerce",
      company: "TechCorp",
      duration: "3 semanas",
      budget: "$4,500",
      tags: ["React", "Node.js", "MongoDB"],
      description: "Desarrollo completo de plataforma de comercio electrónico con sistema de pagos integrado",
      type: "Desarrollo Web"
    },
    {
      id: 2,
      title: "Consultoría IT",
      company: "TechConsult",
      duration: "2 semanas",
      budget: "$3,500",
      tags: ["Arquitectura", "Cloud", "Security"],
      description: "Auditoría de seguridad y optimización de sistemas en la nube",
      type: "Consultoría"
    },
    {
      id: 3,
      title: "Video Marketing",
      company: "VideoPro",
      duration: "2 semanas",
      budget: "$2,000",
      tags: ["After Effects", "Premiere", "Motion Graphics"],
      description: "Videos promocionales para redes sociales con animaciones personalizadas",
      type: "Marketing"
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="jobs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {selectedPeriod ? `Trabajos Disponibles - ${selectedPeriod.period}` : 'Trabajos Disponibles'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="jobs-summary">
            <div className="summary-card">
              <h4>NUEVOS CONTRATOS</h4>
              <div className="summary-number">+18</div>
              <p>Oportunidades disponibles en este período</p>
            </div>
          </div>

          <div className="jobs-grid">
            {sampleJobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <div className="job-title">
                    <h4>{job.title}</h4>
                    <span className="job-company">{job.company}</span>
                  </div>
                  <div className="job-meta">
                    <span className="job-duration">{job.duration}</span>
                    <span className="job-budget">{job.budget}</span>
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

                <div className="job-footer">
                  <span className="job-type">{job.type}</span>
                  <button className="apply-btn">
                    Aplicar
                    <ExternalLink size={14} />
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
