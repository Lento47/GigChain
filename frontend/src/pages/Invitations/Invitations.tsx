import React, { useState, useEffect } from 'react';
import { 
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface JobInvitation {
  id: string;
  job_id: string;
  client_id: string;
  freelancer_id: string;
  freelancer_wallet: string;
  message: string | null;
  status: string;
  invited_at: string;
  responded_at: string | null;
}

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

const Invitations: React.FC = () => {
  const [invitations, setInvitations] = useState<JobInvitation[]>([]);
  const [jobs, setJobs] = useState<{ [key: string]: PrivateJob }>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/private-jobs/invitations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
        
        // Fetch job details for each invitation
        const jobIds = [...new Set(data.map((inv: JobInvitation) => inv.job_id))];
        const jobPromises = jobIds.map(jobId => 
          fetch(`/api/private-jobs/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }).then(res => res.json())
        );
        
        const jobData = await Promise.all(jobPromises);
        const jobMap: { [key: string]: PrivateJob } = {};
        jobData.forEach(job => {
          jobMap[job.id] = job;
        });
        setJobs(jobMap);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, status: 'accepted' | 'declined') => {
    try {
      const response = await fetch(`/api/private-jobs/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Update local state
        setInvitations(prev => 
          prev.map(inv => 
            inv.id === invitationId 
              ? { ...inv, status, responded_at: new Date().toISOString() }
              : inv
          )
        );
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'accepted': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'declined': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'accepted': return CheckCircleIcon;
      case 'declined': return XCircleIcon;
      default: return EnvelopeIcon;
    }
  };

  const filteredInvitations = invitations.filter(invitation => {
    if (filter === 'all') return true;
    return invitation.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Invitaciones de Trabajo
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gestiona las invitaciones a trabajos privados
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Pendientes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {invitations.filter(inv => inv.status === 'pending').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Aceptadas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {invitations.filter(inv => inv.status === 'accepted').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Declinadas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {invitations.filter(inv => inv.status === 'declined').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'pending', label: 'Pendientes' },
              { key: 'accepted', label: 'Aceptadas' },
              { key: 'declined', label: 'Declinadas' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === filterOption.key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invitations List */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          {filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No hay invitaciones
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Las invitaciones a trabajos privados aparecerán aquí.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvitations.map((invitation) => {
                const job = jobs[invitation.job_id];
                const StatusIcon = getStatusIcon(invitation.status);
                
                return (
                  <li key={invitation.id}>
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <StatusIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {job ? job.title : 'Trabajo no disponible'}
                              </h3>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                                {invitation.status}
                              </span>
                            </div>
                            {job && (
                              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                  ${job.budget_min.toLocaleString()} - ${job.budget_max.toLocaleString()}
                                </span>
                                <span className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {job.timeline}
                                </span>
                                <span className="flex items-center">
                                  <UserIcon className="h-4 w-4 mr-1" />
                                  {job.client_wallet.slice(0, 8)}...
                                </span>
                              </div>
                            )}
                            {invitation.message && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Mensaje del cliente:</span> {invitation.message}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Invitado el {new Date(invitation.invited_at).toLocaleDateString()}
                              {invitation.responded_at && (
                                <span> • Respondido el {new Date(invitation.responded_at).toLocaleDateString()}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {invitation.status === 'pending' && (
                            <>
                              <button
                                onClick={() => respondToInvitation(invitation.id, 'accepted')}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Aceptar
                              </button>
                              <button
                                onClick={() => respondToInvitation(invitation.id, 'declined')}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Declinar
                              </button>
                            </>
                          )}
                          {invitation.status === 'accepted' && job && (
                            <button
                              onClick={() => window.location.href = `/private-jobs/${job.id}/apply`}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Aplicar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invitations;