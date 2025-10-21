import React, { useState, useEffect, useRef } from 'react';
import { 
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ExclamationTriangleIcon,
  GithubIcon
} from '@heroicons/react/24/outline';

interface CollaborationGroup {
  id: string;
  job_id: string;
  client_id: string;
  applicants: string[];
  group_chat_id: string | null;
  status: string;
  created_at: string;
  decided_at: string | null;
  selected_applicants: string[] | null;
  project_goals: string[] | null;
  deadlines: string[] | null;
  github_repo: string | null;
}

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  message: string;
  message_type: string;
  timestamp: string;
  encrypted: boolean;
  metadata: any;
}

interface GroupProposal {
  id: string;
  group_id: string;
  proposer_id: string;
  title: string;
  description: string;
  selected_applicants: string[];
  reasoning: string | null;
  votes: { [key: string]: string };
  status: string;
  deadline: string | null;
  created_at: string;
}

interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_wallet: string;
  cover_letter: string;
  proposed_rate: number;
  estimated_time: string;
  relevant_experience: string[];
  portfolio: string[];
  applied_at: string;
  status: string;
}

const CollaborationGroup: React.FC<{ groupId: string }> = ({ groupId }) => {
  const [group, setGroup] = useState<CollaborationGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [proposals, setProposals] = useState<GroupProposal[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGroupData();
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchGroupData = async () => {
    try {
      const [groupResponse, messagesResponse, proposalsResponse] = await Promise.all([
        fetch(`/api/private-jobs/collaboration-group/${groupId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/private-jobs/${groupId}/messages`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/private-jobs/${groupId}/proposals`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroup(groupData);
        
        // Fetch applications for this group
        if (groupData.job_id) {
          const applicationsResponse = await fetch(`/api/private-jobs/${groupData.job_id}/applications`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (applicationsResponse.ok) {
            const applicationsData = await applicationsResponse.json();
            setApplications(applicationsData);
          }
        }
      }

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }

      if (proposalsResponse.ok) {
        const proposalsData = await proposalsResponse.json();
        setProposals(proposalsData);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const websocket = new WebSocket(`ws://localhost:5000/ws/private-jobs/${groupId}/chat`);
    
    websocket.onopen = () => {
      console.log('Connected to group chat');
    };
    
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };
    
    websocket.onclose = () => {
      console.log('Disconnected from group chat');
    };
    
    setWs(websocket);
  };

  const sendMessage = () => {
    if (newMessage.trim() && ws) {
      const message = {
        sender_id: localStorage.getItem('wallet_address'),
        message: newMessage.trim(),
        message_type: 'text',
        timestamp: new Date().toISOString()
      };
      
      ws.send(JSON.stringify(message));
      setNewMessage('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getVoteCounts = (proposal: GroupProposal) => {
    const votes = Object.values(proposal.votes);
    return {
      yes: votes.filter(v => v === 'yes').length,
      no: votes.filter(v => v === 'no').length,
      abstain: votes.filter(v => v === 'abstain').length
    };
  };

  const handleVote = async (proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
    try {
      const response = await fetch(`/api/private-jobs/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote })
      });

      if (response.ok) {
        fetchGroupData(); // Refresh proposals
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const makeFinalDecision = async (selectedApplicants: string[], projectGoals: string[], deadlines: string[]) => {
    try {
      const response = await fetch(`/api/private-jobs/${groupId}/decide`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selected_applicants: selectedApplicants,
          project_goals: projectGoals,
          deadlines: deadlines
        })
      });

      if (response.ok) {
        fetchGroupData();
        setShowDecisionModal(false);
      }
    } catch (error) {
      console.error('Error making decision:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Grupo no encontrado
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Grupo de Colaboración
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {group.applicants.length} participantes • {group.status}
              </p>
            </div>
            <div className="flex space-x-3">
              {group.status === 'active' && (
                <>
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <HandThumbUpIcon className="h-5 w-5 mr-2" />
                    Nueva Propuesta
                  </button>
                  <button
                    onClick={() => setShowDecisionModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Tomar Decisión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Chat Grupal
                </h3>
              </div>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {message.sender_id.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.sender_id.slice(0, 8)}...
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Participantes
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {app.applicant_wallet.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {app.applicant_wallet.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${app.proposed_rate.toLocaleString()}/h
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Proposals */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Propuestas
                </h3>
              </div>
              <div className="p-6">
                {proposals.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay propuestas activas
                  </p>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal) => {
                      const voteCounts = getVoteCounts(proposal);
                      return (
                        <div key={proposal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {proposal.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {proposal.description}
                          </p>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleVote(proposal.id, 'yes')}
                                className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                              >
                                <HandThumbUpIcon className="h-4 w-4" />
                                <span className="text-xs">{voteCounts.yes}</span>
                              </button>
                              <button
                                onClick={() => handleVote(proposal.id, 'no')}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                              >
                                <HandThumbDownIcon className="h-4 w-4" />
                                <span className="text-xs">{voteCounts.no}</span>
                              </button>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              proposal.status === 'active' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                : proposal.status === 'passed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            }`}>
                              {proposal.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Project Info */}
            {group.status === 'decided' && group.selected_applicants && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Proyecto Decidido
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Equipo Seleccionado:
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.selected_applicants.length} miembros
                      </p>
                    </div>
                    
                    {group.project_goals && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Objetivos:
                        </h4>
                        <ul className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {group.project_goals.map((goal, index) => (
                            <li key={index}>• {goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {group.github_repo && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Repositorio:
                        </h4>
                        <a
                          href={group.github_repo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <GithubIcon className="h-4 w-4 mr-1" />
                          Ver en GitHub
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      {showProposalModal && (
        <ProposalModal
          groupId={groupId}
          applicants={applications}
          onClose={() => setShowProposalModal(false)}
          onSuccess={() => {
            setShowProposalModal(false);
            fetchGroupData();
          }}
        />
      )}

      {/* Decision Modal */}
      {showDecisionModal && (
        <DecisionModal
          groupId={groupId}
          applicants={applications}
          onClose={() => setShowDecisionModal(false)}
          onSuccess={makeFinalDecision}
        />
      )}
    </div>
  );
};

// Componente para crear propuesta (simplificado)
const ProposalModal: React.FC<{
  groupId: string;
  applicants: JobApplication[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ groupId, applicants, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selected_applicants: [] as string[],
    reasoning: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar creación de propuesta
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Nueva Propuesta
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleccionar Aplicantes
              </label>
              <div className="mt-2 space-y-2">
                {applicants.map((app) => (
                  <label key={app.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selected_applicants.includes(app.applicant_wallet)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            selected_applicants: [...formData.selected_applicants, app.applicant_wallet]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selected_applicants: formData.selected_applicants.filter(w => w !== app.applicant_wallet)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {app.applicant_wallet.slice(0, 8)}... - ${app.proposed_rate}/h
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
              >
                Crear Propuesta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente para tomar decisión final (simplificado)
const DecisionModal: React.FC<{
  groupId: string;
  applicants: JobApplication[];
  onClose: () => void;
  onSuccess: (selected: string[], goals: string[], deadlines: string[]) => void;
}> = ({ groupId, applicants, onClose, onSuccess }) => {
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [projectGoals, setProjectGoals] = useState<string[]>(['']);
  const [deadlines, setDeadlines] = useState<string[]>(['']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(selectedApplicants, projectGoals.filter(g => g.trim()), deadlines.filter(d => d.trim()));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Tomar Decisión Final
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleccionar Equipo Final
              </label>
              <div className="mt-2 space-y-2">
                {applicants.map((app) => (
                  <label key={app.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedApplicants.includes(app.applicant_wallet)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedApplicants([...selectedApplicants, app.applicant_wallet]);
                        } else {
                          setSelectedApplicants(selectedApplicants.filter(w => w !== app.applicant_wallet));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {app.applicant_wallet.slice(0, 8)}... - ${app.proposed_rate}/h
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Objetivos del Proyecto
              </label>
              {projectGoals.map((goal, index) => (
                <input
                  key={index}
                  type="text"
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...projectGoals];
                    newGoals[index] = e.target.value;
                    setProjectGoals(newGoals);
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={`Objetivo ${index + 1}`}
                />
              ))}
              <button
                type="button"
                onClick={() => setProjectGoals([...projectGoals, ''])}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                + Agregar Objetivo
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Confirmar Decisión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollaborationGroup;