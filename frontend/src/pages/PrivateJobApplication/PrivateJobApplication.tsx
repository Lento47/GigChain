import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface PrivateJob {
  id: string;
  client_id: string;
  client_wallet: string;
  title: string;
  description: string;
  requirements: string[];
  budget_min: number;
  budget_max: number;
  currency: string;
  timeline: string;
  skills: string[];
  visibility: string;
  status: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

interface JobApplication {
  cover_letter: string;
  proposed_rate: number;
  estimated_time: string;
  relevant_experience: string[];
  portfolio: string[];
}

const PrivateJobApplication: React.FC<{ jobId: string }> = ({ jobId }) => {
  const [job, setJob] = useState<PrivateJob | null>(null);
  const [application, setApplication] = useState<JobApplication>({
    cover_letter: '',
    proposed_rate: 0,
    estimated_time: '',
    relevant_experience: [],
    portfolio: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/private-jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        // Set default proposed rate to job's minimum
        setApplication(prev => ({
          ...prev,
          proposed_rate: data.budget_min
        }));
      } else if (response.status === 403) {
        setError('No tienes acceso a este trabajo privado. Debes ser invitado para aplicar.');
      } else {
        setError('Trabajo no encontrado');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Error al cargar los detalles del trabajo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/private-jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(application)
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al enviar la aplicación');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Error al enviar la aplicación');
    } finally {
      setSubmitting(false);
    }
  };

  const addExperience = () => {
    setApplication(prev => ({
      ...prev,
      relevant_experience: [...prev.relevant_experience, '']
    }));
  };

  const updateExperience = (index: number, value: string) => {
    setApplication(prev => ({
      ...prev,
      relevant_experience: prev.relevant_experience.map((exp, i) => 
        i === index ? value : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setApplication(prev => ({
      ...prev,
      relevant_experience: prev.relevant_experience.filter((_, i) => i !== index)
    }));
  };

  const addPortfolio = () => {
    setApplication(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, '']
    }));
  };

  const updatePortfolio = (index: number, value: string) => {
    setApplication(prev => ({
      ...prev,
      portfolio: prev.portfolio.map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const removePortfolio = (index: number) => {
    setApplication(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Error
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aplicación Enviada
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tu aplicación ha sido enviada exitosamente. El cliente será notificado.
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Aplicar a Trabajo Privado
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {job?.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Detalles del Trabajo
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {job?.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Presupuesto
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    ${job?.budget_min.toLocaleString()} - ${job?.budget_max.toLocaleString()} {job?.currency}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Timeline
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {job?.timeline}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Habilidades Requeridas
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {job?.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Requisitos
                  </h4>
                  <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                    {job?.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Tu Aplicación
              </h3>

              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800 dark:text-red-300">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Letter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Carta de Presentación *
                  </label>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Explica por qué eres la persona ideal para este trabajo
                  </p>
                  <textarea
                    value={application.cover_letter}
                    onChange={(e) => setApplication(prev => ({ ...prev, cover_letter: e.target.value }))}
                    rows={6}
                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Describe tu experiencia relevante y por qué quieres trabajar en este proyecto..."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {application.cover_letter.length}/2000 caracteres
                  </p>
                </div>

                {/* Proposed Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tarifa Propuesta (USD/hora) *
                  </label>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Rango sugerido: ${job?.budget_min} - ${job?.budget_max}
                  </p>
                  <input
                    type="number"
                    value={application.proposed_rate}
                    onChange={(e) => setApplication(prev => ({ ...prev, proposed_rate: parseInt(e.target.value) || 0 }))}
                    min={job?.budget_min}
                    max={job?.budget_max}
                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                {/* Estimated Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tiempo Estimado *
                  </label>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Ej: "2-3 semanas", "1 mes", "40 horas"
                  </p>
                  <input
                    type="text"
                    value={application.estimated_time}
                    onChange={(e) => setApplication(prev => ({ ...prev, estimated_time: e.target.value }))}
                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="2-3 semanas"
                    required
                  />
                </div>

                {/* Relevant Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Experiencia Relevante
                  </label>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Describe proyectos similares o experiencia relacionada
                  </p>
                  <div className="mt-2 space-y-2">
                    {application.relevant_experience.map((exp, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={exp}
                          onChange={(e) => updateExperience(index, e.target.value)}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Proyecto similar o experiencia relevante"
                        />
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addExperience}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Agregar Experiencia
                    </button>
                  </div>
                </div>

                {/* Portfolio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Portfolio
                  </label>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Enlaces a trabajos anteriores, GitHub, Behance, etc.
                  </p>
                  <div className="mt-2 space-y-2">
                    {application.portfolio.map((item, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="url"
                          value={item}
                          onChange={(e) => updatePortfolio(index, e.target.value)}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="https://ejemplo.com"
                        />
                        <button
                          type="button"
                          onClick={() => removePortfolio(index)}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPortfolio}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Agregar Enlace
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Enviar Aplicación
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateJobApplication;