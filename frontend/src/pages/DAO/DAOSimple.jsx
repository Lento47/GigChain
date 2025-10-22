import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { Vote, ThumbsUp, ThumbsDown, Clock, Users, TrendingUp, CheckCircle } from 'lucide-react';
import WalletBanner from '../../components/Web3/WalletBanner';
import './DAO.css';
import '../../styles/web3-theme.css';

const DAOSimple = () => {
  const { address } = useWallet();
  const { sessionData } = useWalletAuth();
  const [proposals, setProposals] = useState([]);
  const [votingPower, setVotingPower] = useState(100);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    const mockProposals = [
      {
        id: 1,
        title: 'Aumentar recompensas de staking al 15% APY',
        description: 'Propuesta para incrementar las recompensas de staking del pool flexible del 8.5% al 15% APY para atraer más liquidez.',
        author: {
          name: 'Carlos DAO',
          address: '0x1234...5678',
          avatar: '👨‍💼'
        },
        status: 'active',
        votesFor: 1250,
        votesAgainst: 340,
        totalVotes: 1590,
        quorum: 2000,
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        userVote: null
      },
      {
        id: 2,
        title: 'Implementar Marketplace descentralizado v2.0',
        description: 'Actualización del marketplace con nuevas características: escrow automático, resolución de disputas AI y sistema de reputación mejorado.',
        author: {
          name: 'María Dev',
          address: '0x8765...4321',
          avatar: '👩‍💻'
        },
        status: 'active',
        votesFor: 2890,
        votesAgainst: 567,
        totalVotes: 3457,
        quorum: 2000,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        userVote: null
      },
      {
        id: 3,
        title: 'Reducir comisión de plataforma al 2%',
        description: 'Propuesta para reducir la comisión actual del 5% al 2% para ser más competitivos y atraer más freelancers.',
        author: {
          name: 'Pedro Token',
          address: '0xabcd...ef01',
          avatar: '🎯'
        },
        status: 'active',
        votesFor: 890,
        votesAgainst: 1230,
        totalVotes: 2120,
        quorum: 2000,
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        userVote: null
      },
      {
        id: 4,
        title: 'Programa de Grants para desarrolladores',
        description: 'Establecer un fondo de 100,000 GIG para financiar proyectos y herramientas que mejoren el ecosistema GigChain.',
        author: {
          name: 'Ana Builder',
          address: '0xdef0...1234',
          avatar: '🏗️'
        },
        status: 'passed',
        votesFor: 4560,
        votesAgainst: 890,
        totalVotes: 5450,
        quorum: 2000,
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        userVote: 'for'
      },
      {
        id: 5,
        title: 'Integración con Ethereum Layer 2',
        description: 'Expandir GigChain a Arbitrum y Optimism para reducir costos de transacción.',
        author: {
          name: 'Luis Chain',
          address: '0x5678...abcd',
          avatar: '⛓️'
        },
        status: 'rejected',
        votesFor: 890,
        votesAgainst: 2340,
        totalVotes: 3230,
        quorum: 2000,
        endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        userVote: null
      }
    ];

    setProposals(mockProposals);
  }, []);

  const handleVote = (proposalId, voteType) => {
    setProposals(proposals.map(p => {
      if (p.id === proposalId) {
        const newVotesFor = voteType === 'for' ? p.votesFor + votingPower : p.votesFor;
        const newVotesAgainst = voteType === 'against' ? p.votesAgainst + votingPower : p.votesAgainst;
        
        return {
          ...p,
          votesFor: newVotesFor,
          votesAgainst: newVotesAgainst,
          totalVotes: newVotesFor + newVotesAgainst,
          userVote: voteType
        };
      }
      return p;
    }));
    alert(`¡Voto ${voteType === 'for' ? 'a favor' : 'en contra'} registrado!`);
  };

  const calculateTimeRemaining = (endDate) => {
    const now = new Date();
    const diff = endDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Finalizada';
  };

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return ((votes / total) * 100).toFixed(1);
  };

  const filteredProposals = proposals.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Activa', class: 'status-active', icon: <Clock size={14} /> },
      passed: { text: 'Aprobada', class: 'status-passed', icon: <CheckCircle size={14} /> },
      rejected: { text: 'Rechazada', class: 'status-rejected', icon: <ThumbsDown size={14} /> }
    };
    return badges[status] || badges.active;
  };

  return (
    <div className="dao-container">
      {/* Wallet Connection Banner */}
      <WalletBanner />
      
      <div className="dao-header">
        <h1 className="gradient-text">🗳️ DAO GigChain</h1>
        <p className="dao-subtitle">Participa en la gobernanza descentralizada de la plataforma</p>
      </div>

      {/* Voting Power Card */}
      <div className="voting-power-card">
        <div className="power-icon">
          <Vote size={32} />
        </div>
        <div className="power-info">
          <p className="power-label">Tu Poder de Voto</p>
          <h2>{votingPower} GIG</h2>
          <p className="power-hint">Basado en tus tokens stakeados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="dao-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button 
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Activas
        </button>
        <button 
          className={`filter-btn ${filter === 'passed' ? 'active' : ''}`}
          onClick={() => setFilter('passed')}
        >
          Aprobadas
        </button>
        <button 
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rechazadas
        </button>
      </div>

      {/* Proposals List */}
      <div className="proposals-list">
        {filteredProposals.length === 0 ? (
          <div className="empty-proposals">
            <p>No hay propuestas con ese filtro.</p>
          </div>
        ) : (
          filteredProposals.map(proposal => {
            const badge = getStatusBadge(proposal.status);
            const forPercentage = calculatePercentage(proposal.votesFor, proposal.totalVotes);
            const againstPercentage = calculatePercentage(proposal.votesAgainst, proposal.totalVotes);
            const quorumPercentage = calculatePercentage(proposal.totalVotes, proposal.quorum);

            return (
              <div key={proposal.id} className="proposal-card">
                <div className="proposal-header">
                  <div className="proposal-author">
                    <div className="author-avatar">{proposal.author.avatar}</div>
                    <div>
                      <h4>{proposal.author.name}</h4>
                      <p className="author-address">{proposal.author.address}</p>
                    </div>
                  </div>
                  <div className={`status-badge ${badge.class}`}>
                    {badge.icon}
                    {badge.text}
                  </div>
                </div>

                <div className="proposal-content">
                  <h3>{proposal.title}</h3>
                  <p>{proposal.description}</p>
                </div>

                <div className="proposal-stats">
                  <div className="stat-item">
                    <Users size={16} />
                    <span>{proposal.totalVotes} votos</span>
                  </div>
                  <div className="stat-item">
                    <TrendingUp size={16} />
                    <span>Quórum: {quorumPercentage}%</span>
                  </div>
                  {proposal.status === 'active' && (
                    <div className="stat-item time-remaining">
                      <Clock size={16} />
                      <span>{calculateTimeRemaining(proposal.endDate)}</span>
                    </div>
                  )}
                </div>

                <div className="voting-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-for"
                      style={{ width: `${forPercentage}%` }}
                    />
                    <div 
                      className="progress-against"
                      style={{ width: `${againstPercentage}%` }}
                    />
                  </div>
                  <div className="progress-labels">
                    <span className="label-for">
                      <ThumbsUp size={14} />
                      A favor: {proposal.votesFor} ({forPercentage}%)
                    </span>
                    <span className="label-against">
                      <ThumbsDown size={14} />
                      En contra: {proposal.votesAgainst} ({againstPercentage}%)
                    </span>
                  </div>
                </div>

                {proposal.status === 'active' && !proposal.userVote && (
                  <div className="voting-buttons">
                    <button 
                      className="vote-btn vote-for"
                      onClick={() => handleVote(proposal.id, 'for')}
                    >
                      <ThumbsUp size={18} />
                      Votar a Favor
                    </button>
                    <button 
                      className="vote-btn vote-against"
                      onClick={() => handleVote(proposal.id, 'against')}
                    >
                      <ThumbsDown size={18} />
                      Votar en Contra
                    </button>
                  </div>
                )}

                {proposal.userVote && (
                  <div className="user-voted">
                    <CheckCircle size={18} />
                    Ya votaste {proposal.userVote === 'for' ? 'a favor' : 'en contra'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DAOSimple;

