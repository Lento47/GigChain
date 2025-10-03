import React, { useState, useEffect } from 'react';
import { ThirdwebProvider, ConnectWallet, useContract, useContractWrite, useAddress, useDisconnect } from '@thirdweb-dev/react';
import { Polygon, Mumbai } from '@thirdweb-dev/chains';
import axios from 'axios';
import { Wallet, FileText, Zap, Shield, User, Globe, MapPin, Star, Code, Camera, Music, Linkedin, Github, Menu, Home, Settings, BarChart3, MessageSquare, Eye, Send } from 'lucide-react';
import './App.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Dashboard Metrics Hook
const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    activeContracts: 0,
    totalEarnings: 0,
    averageRating: 0,
    completedProjects: 0,
    recentActivity: []
  });

  const [contracts, setContracts] = useState([]);

  // Load contracts from localStorage or API
  React.useEffect(() => {
    const loadContracts = () => {
      try {
        const savedContracts = localStorage.getItem('gigchain-contracts');
        const contractsData = savedContracts ? JSON.parse(savedContracts) : [];
        setContracts(contractsData);
        
        // Calculate metrics based on contracts
        const activeContracts = contractsData.filter(c => c.status === 'active' || c.status === 'in-progress').length;
        const completedProjects = contractsData.filter(c => c.status === 'completed').length;
        
        // Calculate total earnings from completed contracts
        const totalEarnings = contractsData
          .filter(c => c.status === 'completed' && c.paidAmount)
          .reduce((sum, c) => sum + (c.paidAmount || 0), 0);
        
        // Calculate average rating
        const ratings = contractsData
          .filter(c => c.rating && c.rating > 0)
          .map(c => c.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;
        
        // Generate recent activity
        const recentActivity = contractsData
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 3)
          .map(contract => {
            const timeDiff = new Date() - new Date(contract.updatedAt || contract.createdAt);
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);
            
            let timeAgo;
            if (hours < 1) timeAgo = 'Hace menos de 1 hora';
            else if (hours < 24) timeAgo = `Hace ${hours} horas`;
            else timeAgo = `Hace ${days} días`;
            
            return {
              id: contract.id,
              type: contract.status === 'completed' ? 'payment' : 
                    contract.status === 'active' ? 'contract' : 'message',
              title: contract.status === 'completed' ? 'Pago recibido' :
                     contract.status === 'active' ? 'Nuevo contrato generado' :
                     'Mensaje del cliente',
              description: `${contract.title} - $${contract.amount || contract.paidAmount || 0}`,
              timeAgo: timeAgo
            };
          });
        
        setMetrics({
          activeContracts,
          totalEarnings,
          averageRating: Math.round(averageRating * 10) / 10,
          completedProjects,
          recentActivity
        });
      } catch (error) {
        console.error('Error loading contracts:', error);
      }
    };

    loadContracts();
    
    // Listen for contract updates
    const handleStorageChange = () => {
      loadContracts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for updates
    const interval = setInterval(loadContracts, 30000); // Every 30 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const addContract = (contract) => {
    const newContract = {
      ...contract,
      id: Date.now().toString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedContracts = [...contracts, newContract];
    setContracts(updatedContracts);
    localStorage.setItem('gigchain-contracts', JSON.stringify(updatedContracts));
  };

  const updateContractStatus = (contractId, status, additionalData = {}) => {
    const updatedContracts = contracts.map(contract => 
      contract.id === contractId 
        ? { ...contract, status, updatedAt: new Date().toISOString(), ...additionalData }
        : contract
    );
    
    setContracts(updatedContracts);
    localStorage.setItem('gigchain-contracts', JSON.stringify(updatedContracts));
  };

  return {
    metrics,
    contracts,
    addContract,
    updateContractStatus
  };
};

// Wallet validation utility
const isValidEthereumAddress = (address) => {
  if (!address) return false;
  // Basic Ethereum address validation (42 characters, starts with 0x)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const isValidContractAddress = (address) => {
  if (!address) return false;
  // Same validation as Ethereum address for now
  return isValidEthereumAddress(address);
};

// Utility to get wallet info (for demonstration)
const getWalletInfo = async (address) => {
  if (!isValidEthereumAddress(address)) {
    return { valid: false, error: 'Invalid address format' };
  }
  
  // In a real implementation, you would query the blockchain
  // For now, we'll just return basic validation
  return {
    valid: true,
    address: address,
    type: 'Ethereum-compatible',
    network: 'Polygon/Mumbai'
  };
};

// Freelancer Profile Component
function FreelancerProfile({ formData, handleInputChange, walletValidation }) {
  return (
    <div className="profile-section freelancer-profile">
      <div className="profile-header">
        <User size={24} />
        <h3>Perfil del Freelancer</h3>
        <p>Completa tu perfil profesional para generar más confianza</p>
      </div>

      <div className="profile-grid">
        {/* Basic Info */}
        <div className="profile-group">
          <h4>Información Básica</h4>
          <div className="form-row">
            <div className="field-group">
              <label htmlFor="freelancerName">Nombre Completo *</label>
              <input
                type="text"
                id="freelancerName"
                name="freelancerName"
                value={formData.freelancerName}
                onChange={handleInputChange}
                placeholder="Juan Pérez"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="freelancerTitle">Título Profesional *</label>
              <input
                type="text"
                id="freelancerTitle"
                name="freelancerTitle"
                value={formData.freelancerTitle}
                onChange={handleInputChange}
                placeholder="Desarrollador Full Stack"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field-group">
              <label htmlFor="freelancerLocation">
                <MapPin size={16} />
                Ubicación
              </label>
              <input
                type="text"
                id="freelancerLocation"
                name="freelancerLocation"
                value={formData.freelancerLocation}
                onChange={handleInputChange}
                placeholder="Madrid, España"
              />
            </div>
            <div className="field-group">
              <label htmlFor="freelancerRate">
                <Star size={16} />
                Tarifa por Hora (USD)
              </label>
              <input
                type="number"
                id="freelancerRate"
                name="freelancerRate"
                value={formData.freelancerRate}
                onChange={handleInputChange}
                placeholder="50"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="freelancerBio">Biografía Profesional *</label>
            <textarea
              id="freelancerBio"
              name="freelancerBio"
              value={formData.freelancerBio}
              onChange={handleInputChange}
              placeholder="Desarrollador con 5+ años de experiencia en React, Node.js y blockchain. Especializado en aplicaciones Web3 y contratos inteligentes."
              rows={3}
              required
            />
          </div>
        </div>

        {/* Skills & Experience */}
        <div className="profile-group">
          <h4>Habilidades y Experiencia</h4>
          <div className="field-group">
            <label htmlFor="freelancerSkills">Habilidades Técnicas *</label>
            <input
              type="text"
              id="freelancerSkills"
              name="freelancerSkills"
              value={formData.freelancerSkills}
              onChange={handleInputChange}
              placeholder="React, Node.js, Solidity, Web3, TypeScript, PostgreSQL"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="freelancerExperience">Años de Experiencia *</label>
            <select
              id="freelancerExperience"
              name="freelancerExperience"
              value={formData.freelancerExperience}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona experiencia</option>
              <option value="0-1">0-1 años</option>
              <option value="1-3">1-3 años</option>
              <option value="3-5">3-5 años</option>
              <option value="5-10">5-10 años</option>
              <option value="10+">10+ años</option>
            </select>
          </div>
        </div>

        {/* Social Links */}
        <div className="profile-group">
          <h4>Redes Sociales y Portfolio</h4>
          <div className="social-links-grid">
            <div className="field-group">
              <label htmlFor="freelancerLinkedIn">
                <Linkedin size={16} />
                LinkedIn
              </label>
              <input
                type="url"
                id="freelancerLinkedIn"
                name="freelancerLinkedIn"
                value={formData.freelancerLinkedIn}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/tu-perfil"
              />
            </div>
            <div className="field-group">
              <label htmlFor="freelancerGithub">
                <Github size={16} />
                GitHub
              </label>
              <input
                type="url"
                id="freelancerGithub"
                name="freelancerGithub"
                value={formData.freelancerGithub}
                onChange={handleInputChange}
                placeholder="https://github.com/tu-usuario"
              />
            </div>
            <div className="field-group">
              <label htmlFor="freelancerPortfolio">
                <Globe size={16} />
                Portfolio/Website
              </label>
              <input
                type="url"
                id="freelancerPortfolio"
                name="freelancerPortfolio"
                value={formData.freelancerPortfolio}
                onChange={handleInputChange}
                placeholder="https://tu-portfolio.com"
              />
            </div>
            <div className="field-group">
              <label htmlFor="freelancerX">X (Twitter)</label>
              <input
                type="url"
                id="freelancerX"
                name="freelancerX"
                value={formData.freelancerX}
                onChange={handleInputChange}
                placeholder="https://x.com/tu-usuario"
              />
            </div>
            <div className="field-group">
              <label htmlFor="freelancerInstagram">
                <Camera size={16} />
                Instagram
              </label>
              <input
                type="url"
                id="freelancerInstagram"
                name="freelancerInstagram"
                value={formData.freelancerInstagram}
                onChange={handleInputChange}
                placeholder="https://instagram.com/tu-usuario"
              />
            </div>
            <div className="field-group">
              <label htmlFor="freelancerTikTok">
                <Music size={16} />
                TikTok
              </label>
              <input
                type="url"
                id="freelancerTikTok"
                name="freelancerTikTok"
                value={formData.freelancerTikTok}
                onChange={handleInputChange}
                placeholder="https://tiktok.com/@tu-usuario"
              />
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="profile-group">
          <h4>Wallet de Pago</h4>
          <div className="field-group">
            <label htmlFor="freelancerWallet">
              <Wallet size={16} />
              Dirección de Wallet
              {walletValidation.freelancer.loading && <span className="loading-indicator">Validando...</span>}
              {walletValidation.freelancer.valid && <span className="valid-indicator">✓ Válida</span>}
              {walletValidation.freelancer.error && <span className="error-indicator">✗ {walletValidation.freelancer.error}</span>}
            </label>
            <input
              type="text"
              id="freelancerWallet"
              name="freelancerWallet"
              value={formData.freelancerWallet}
              onChange={handleInputChange}
              placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
              className={walletValidation.freelancer.valid ? 'valid' : walletValidation.freelancer.error ? 'invalid' : ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Client Profile Component
function ClientProfile({ formData, handleInputChange, walletValidation }) {
  return (
    <div className="profile-section client-profile">
      <div className="profile-header">
        <User size={24} />
        <h3>Perfil del Cliente</h3>
        <p>Información sobre tu empresa o proyecto</p>
      </div>

      <div className="profile-grid">
        <div className="profile-group">
          <h4>Información de la Empresa</h4>
          <div className="form-row">
            <div className="field-group">
              <label htmlFor="clientName">Nombre del Contacto *</label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                placeholder="María García"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="clientCompany">Empresa/Proyecto *</label>
              <input
                type="text"
                id="clientCompany"
                name="clientCompany"
                value={formData.clientCompany}
                onChange={handleInputChange}
                placeholder="TechStartup Inc."
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="clientLocation">
              <MapPin size={16} />
              Ubicación
            </label>
            <input
              type="text"
              id="clientLocation"
              name="clientLocation"
              value={formData.clientLocation}
              onChange={handleInputChange}
              placeholder="Barcelona, España"
            />
          </div>

          <div className="field-group">
            <label htmlFor="clientBio">Descripción del Proyecto/Empresa *</label>
            <textarea
              id="clientBio"
              name="clientBio"
              value={formData.clientBio}
              onChange={handleInputChange}
              placeholder="Startup tecnológica enfocada en soluciones blockchain para el sector financiero. Buscamos desarrolladores para nuestro próximo proyecto de DeFi."
              rows={3}
              required
            />
          </div>
        </div>

        <div className="profile-group">
          <h4>Wallet de Pago</h4>
          <div className="field-group">
            <label htmlFor="clientWallet">
              <Wallet size={16} />
              Dirección de Wallet
              {walletValidation.client.loading && <span className="loading-indicator">Validando...</span>}
              {walletValidation.client.valid && <span className="valid-indicator">✓ Válida</span>}
              {walletValidation.client.error && <span className="error-indicator">✗ {walletValidation.client.error}</span>}
            </label>
            <input
              type="text"
              id="clientWallet"
              name="clientWallet"
              value={formData.clientWallet}
              onChange={handleInputChange}
              placeholder="0x8ba1f109551bD432803012645Hac136c22C131e"
              className={walletValidation.client.valid ? 'valid' : walletValidation.client.error ? 'invalid' : ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractForm({ onContractCreated, selectedTemplate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    description: '',
    offeredAmount: '',
    requestedAmount: '',
    days: '',
    role: 'freelancer', // 'freelancer' or 'client'
    freelancerWallet: '',
    clientWallet: '',
    // Freelancer Profile
    freelancerName: '',
    freelancerTitle: '',
    freelancerBio: '',
    freelancerSkills: '',
    freelancerExperience: '',
    freelancerLocation: '',
    freelancerRate: '',
    // Social Links
    freelancerX: '',
    freelancerFacebook: '',
    freelancerInstagram: '',
    freelancerTikTok: '',
    freelancerLinkedIn: '',
    freelancerGithub: '',
    freelancerPortfolio: '',
    // Client Profile
    clientName: '',
    clientCompany: '',
    clientBio: '',
    clientLocation: ''
  });

  // Apply template data when selected
  React.useEffect(() => {
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        description: selectedTemplate.description || prev.description,
        offeredAmount: selectedTemplate.pricing?.amount?.toString() || prev.offeredAmount,
        requestedAmount: selectedTemplate.pricing?.amount?.toString() || prev.requestedAmount,
        days: selectedTemplate.timeline?.duration?.toString() || prev.days,
        freelancerSkills: selectedTemplate.skills?.join(', ') || prev.freelancerSkills
      }));
    }
  }, [selectedTemplate]);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walletValidation, setWalletValidation] = useState({
    freelancer: { valid: false, loading: false, error: null, address: null },
    client: { valid: false, loading: false, error: null, address: null }
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-validate wallet addresses
    if (name === 'freelancerWallet' || name === 'clientWallet') {
      validateWallet(name, value);
    }
  };

  // Validate wallet address
  const validateWallet = async (walletType, address) => {
    if (!address.trim()) {
      setWalletValidation(prev => ({
        ...prev,
        [walletType]: { valid: false, loading: false, error: null, address: null }
      }));
      return;
    }

    // Basic format validation
    if (!isValidEthereumAddress(address)) {
      setWalletValidation(prev => ({
        ...prev,
        [walletType]: { 
          valid: false, 
          loading: false, 
          error: 'Formato de dirección inválido', 
          address: null 
        }
      }));
      return;
    }

    // Set loading state
    setWalletValidation(prev => ({
      ...prev,
      [walletType]: { valid: false, loading: true, error: null, address: address }
    }));

    try {
      // Call backend validation
      const response = await axios.post(`${API_BASE_URL}/api/validate_wallet`, {
        address: address,
        network: 'polygon'
      });

      setWalletValidation(prev => ({
        ...prev,
        [walletType]: { 
          valid: response.data.valid, 
          loading: false, 
          error: response.data.error, 
          address: address 
        }
      }));
    } catch (err) {
      setWalletValidation(prev => ({
        ...prev,
        [walletType]: { 
          valid: false, 
          loading: false, 
          error: 'Error validando wallet', 
          address: address 
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.description.trim()) {
      setError('La descripción del proyecto es requerida');
      return;
    }

    // Validate wallets
    if (!walletValidation.freelancer.valid && formData.freelancerWallet) {
      setError('La wallet del freelancer no es válida');
      return;
    }

    if (!walletValidation.client.valid && formData.clientWallet) {
      setError('La wallet del cliente no es válida');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the new structured endpoint
      const response = await axios.post(`${API_BASE_URL}/api/structured_contract`, {
        description: formData.description,
        offeredAmount: formData.offeredAmount ? parseFloat(formData.offeredAmount) : null,
        requestedAmount: formData.requestedAmount ? parseFloat(formData.requestedAmount) : null,
        days: formData.days ? parseInt(formData.days) : null,
        role: formData.role,
        freelancerWallet: formData.freelancerWallet || null,
        clientWallet: formData.clientWallet || null
      });
      
      setContract(response.data);
      
      // Add contract to tracking system
      if (onContractCreated) {
        onContractCreated({
          title: formData.description,
          amount: parseFloat(formData.offeredAmount || formData.requestedAmount || 0),
          status: 'active',
          contractId: response.data.contract_id,
          role: formData.role
        });
      }
    } catch (err) {
      console.error('API error:', err);
      setError(err.response?.data?.detail || 'Error generating contract');
    } finally {
      setLoading(false);
    }
  };


  const steps = [
    { id: 1, title: 'Rol', description: 'Selecciona tu rol' },
    { id: 2, title: 'Perfil', description: 'Completa tu perfil' },
    { id: 3, title: 'Proyecto', description: 'Detalles del proyecto' },
    { id: 4, title: 'Revisar', description: 'Revisa y genera' }
  ];

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.role;
      case 2: return formData.role === 'freelancer' ? 
        formData.freelancerName && formData.freelancerTitle && formData.freelancerBio :
        formData.clientName && formData.clientCompany && formData.clientBio;
      case 3: return formData.description;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="contract-form">
      {/* Step Progress */}
      <div className="step-progress">
        {steps.map((step, index) => (
          <div key={step.id} className={`step ${currentStep >= step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
            <div className="step-circle">
              {currentStep > step.id ? <Zap size={16} /> : step.id}
            </div>
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>
            <FileText size={20} />
            Crea tu contrato de gig
          </h3>
          <p>Paso {currentStep} de 4: {steps[currentStep - 1].title}</p>
        </div>

        <div className="form-fields">
          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <div className="step-content">
          <div className="field-group">
            <label>¿Cuál es tu rol?</label>
            <div className="role-selector">
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="freelancer"
                  checked={formData.role === 'freelancer'}
                  onChange={handleInputChange}
                />
                <span>Freelancer (ofrezco servicios)</span>
              </label>
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === 'client'}
                  onChange={handleInputChange}
                />
                <span>Cliente (busco servicios)</span>
              </label>
            </div>
          </div>
            </div>
          )}

          {/* Step 2: Profile Section */}
          {currentStep === 2 && (
            <div className="step-content">
          {formData.role === 'freelancer' ? (
            <FreelancerProfile 
              formData={formData} 
              handleInputChange={handleInputChange} 
              walletValidation={walletValidation} 
            />
          ) : (
            <ClientProfile 
              formData={formData} 
              handleInputChange={handleInputChange} 
              walletValidation={walletValidation} 
            />
              )}
            </div>
          )}

          {/* Step 3: Project Details */}
          {currentStep === 3 && (
            <div className="step-content">
          <div className="project-section">
            <div className="profile-header">
              <FileText size={24} />
              <h3>Detalles del Proyecto</h3>
              <p>Información específica sobre el trabajo a realizar</p>
            </div>

            <div className="field-group">
              <label htmlFor="description">
                Descripción del proyecto *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe el proyecto, tareas específicas, tecnologías requeridas, etc."
                rows={4}
                disabled={loading}
                required
              />
            </div>

            {/* Amount Fields */}
            <div className="amount-fields">
              <div className="field-group">
                <label htmlFor="offeredAmount">
                  {formData.role === 'freelancer' ? 'Monto que ofrezco (USD)' : 'Monto que ofrece el freelancer (USD)'}
                </label>
                <input
                  type="number"
                  id="offeredAmount"
                  name="offeredAmount"
                  value={formData.offeredAmount}
                  onChange={handleInputChange}
                  placeholder="2000"
                  disabled={loading}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="field-group">
                <label htmlFor="requestedAmount">
                  {formData.role === 'client' ? 'Monto que solicito (USD)' : 'Monto que solicita el cliente (USD)'}
                </label>
                <input
                  type="number"
                  id="requestedAmount"
                  name="requestedAmount"
                  value={formData.requestedAmount}
                  onChange={handleInputChange}
                  placeholder="5000"
                  disabled={loading}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Days */}
            <div className="field-group">
              <label htmlFor="days">Duración del proyecto (días)</label>
              <input
                type="number"
                id="days"
                name="days"
                value={formData.days}
                onChange={handleInputChange}
                placeholder="20"
                disabled={loading}
                min="1"
              />
            </div>
          </div>
        </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="step-content">
              <div className="review-section">
                <h3>Revisa tu contrato</h3>
                <div className="review-grid">
                  <div className="review-item">
                    <h4>Rol</h4>
                    <p>{formData.role === 'freelancer' ? 'Freelancer' : 'Cliente'}</p>
                  </div>
                  <div className="review-item">
                    <h4>Nombre</h4>
                    <p>{formData.role === 'freelancer' ? formData.freelancerName : formData.clientName}</p>
                  </div>
                  <div className="review-item">
                    <h4>Proyecto</h4>
                    <p>{formData.description}</p>
                  </div>
                  <div className="review-item">
                    <h4>Monto ofrecido</h4>
                    <p>${formData.offeredAmount || 'No especificado'}</p>
                  </div>
                  <div className="review-item">
                    <h4>Monto solicitado</h4>
                    <p>${formData.requestedAmount || 'No especificado'}</p>
                  </div>
                  <div className="review-item">
                    <h4>Duración</h4>
                    <p>{formData.days ? `${formData.days} días` : 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="form-actions">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="btn-secondary">
              Anterior
            </button>
          )}
          
          {currentStep < 4 ? (
            <button 
              type="button" 
              onClick={nextStep} 
              disabled={!canProceed()}
              className="btn-primary"
            >
              Siguiente
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading || !canProceed()}
              className="btn-primary"
            >
          {loading ? (
            <>
              <Zap className="spinning" size={16} />
              Generando Contrato IA...
            </>
          ) : (
            <>
              <Zap size={16} />
              Generar Contrato Inteligente
            </>
          )}
        </button>
          )}
        </div>
      </form>

      {error && (
        <div className="error-message">
          <Shield size={16} />
          {error}
        </div>
      )}

      {contract && (
        <ContractDisplay contract={contract} />
      )}
    </div>
  );
}

function ContractDisplay({ contract }) {
  // Manual contract address input
  const [manualContractAddress, setManualContractAddress] = useState('');
  const [useManualAddress, setUseManualAddress] = useState(false);
  
  // Determine which contract address to use
  const contractAddress = useManualAddress ? manualContractAddress : contract.json?.escrow_params?.contract_address;
  const { contract: thirdwebContract } = useContract(contractAddress);
  
  // Only initialize useContractWrite if we have a valid contract
  const contractWriteResult = useContractWrite(thirdwebContract, "deploy");
  const { mutate: deployContract, isLoading: isDeploying } = contractWriteResult || {};
  
  // Testing utilities
  const [testMode, setTestMode] = useState(false);
  
  // Validation states
  const isAddressValid = isValidContractAddress(contractAddress);
  const [walletInfo, setWalletInfo] = useState(null);
  const [checkingWallet, setCheckingWallet] = useState(false);

  const handleCheckWallet = async () => {
    if (!contractAddress) return;
    
    setCheckingWallet(true);
    try {
      const info = await getWalletInfo(contractAddress);
      setWalletInfo(info);
    } catch (error) {
      console.error('Error checking wallet:', error);
      setWalletInfo({ valid: false, error: 'Failed to check wallet' });
    } finally {
      setCheckingWallet(false);
    }
  };

  const handleDeployEscrow = () => {
    if (contract.json?.escrow_params && thirdwebContract && deployContract) {
      try {
        // Deploy escrow contract with milestones
        deployContract({
          args: [
            contract.json.escrow_params.token,
            contract.json.escrow_params.milestones
          ]
        });
      } catch (error) {
        console.error('Error deploying contract:', error);
        alert('Error deploying contract: ' + error.message);
      }
    } else {
      console.error('Missing contract data or thirdweb contract instance');
      alert('Cannot deploy: Contract address or data is missing');
    }
  };

  return (
    <div className="contract-display">
      <div className="contract-header">
        <h3>
          <FileText size={20} />
          Generated Contract
        </h3>
        <span className="contract-id">
          ID: {contract.contract_id}
        </span>
      </div>

      <div className="contract-content">
        {contract.json ? (
          <div className="ai-contract">
            <div className="contract-section">
              <h4>🤖 AI-Generated Terms</h4>
              <div className="terms">
                {contract.json.full_terms}
              </div>
            </div>

            <div className="contract-section">
              <h4>💰 Escrow Parameters</h4>
              <div className="escrow-params">
                <p><strong>Token:</strong> {contract.json.escrow_params?.token}</p>
                <div className="milestones">
                  <h5>Milestones:</h5>
                  {contract.json.escrow_params?.milestones?.map((milestone, index) => (
                    <div key={index} className="milestone">
                      <span className="amount">{milestone.amount} USDC</span>
                      <span className="description">{milestone.description}</span>
                      <span className="deadline">{milestone.deadline}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="contract-section">
              <h4>📋 Legal Clauses</h4>
              <ul className="clauses">
                {contract.json.clauses?.map((clause, index) => (
                  <li key={index}>{clause}</li>
                ))}
              </ul>
            </div>

            {contract.escrow_ready && (
              <div className="deploy-section">
                {/* Contract Address Input */}
                <div className="contract-address-section">
                  <h4>🔗 Contract Address</h4>
                  <div className="address-input-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={useManualAddress}
                        onChange={(e) => setUseManualAddress(e.target.checked)}
                      />
                      Use custom contract address
                    </label>
                    
                    {useManualAddress && (
                      <div className="manual-address-input">
                        <input
                          type="text"
                          placeholder="0x..."
                          value={manualContractAddress}
                          onChange={(e) => setManualContractAddress(e.target.value)}
                          className={isAddressValid || !manualContractAddress ? 'valid' : 'invalid'}
                        />
                        {manualContractAddress && (
                          <div className={`address-validation ${isAddressValid ? 'valid' : 'invalid'}`}>
                            {isAddressValid ? '✅ Valid address' : '❌ Invalid address format'}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!useManualAddress && contract.json?.escrow_params?.contract_address && (
                      <div className="auto-address">
                        <span className="address-display">
                          📋 Auto-generated: {contract.json.escrow_params.contract_address}
                        </span>
                      </div>
                    )}
                    
                    {!useManualAddress && !contract.json?.escrow_params?.contract_address && (
                      <div className="no-address-warning">
                        ⚠️ No contract address provided in contract data
                      </div>
                    )}
                    
                    {contractAddress && (
                      <div className="wallet-check-section">
                        <button 
                          onClick={handleCheckWallet}
                          disabled={checkingWallet || !isAddressValid}
                          className="check-wallet-btn"
                        >
                          {checkingWallet ? (
                            <>
                              <Zap className="spinning" size={16} />
                              Checking...
                            </>
                          ) : (
                            <>
                              <Wallet size={16} />
                              Verify Wallet Address
                            </>
                          )}
                        </button>
                        
                        {walletInfo && (
                          <div className={`wallet-info ${walletInfo.valid ? 'valid' : 'invalid'}`}>
                            {walletInfo.valid ? (
                              <>
                                <p>✅ <strong>Valid Wallet</strong></p>
                                <p>Type: {walletInfo.type}</p>
                                <p>Network: {walletInfo.network}</p>
                                <p>Address: {walletInfo.address}</p>
                              </>
                            ) : (
                              <>
                                <p>❌ <strong>Invalid Wallet</strong></p>
                                <p>Error: {walletInfo.error}</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="test-mode-toggle">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={testMode}
                      onChange={(e) => setTestMode(e.target.checked)}
                    />
                    🧪 Test Mode (Mumbai Testnet)
                  </label>
                </div>
                
                <button 
                  onClick={handleDeployEscrow}
                  disabled={isDeploying || !deployContract || !isAddressValid || !contractAddress}
                  className="deploy-button"
                >
                  {isDeploying ? (
                    <>
                      <Zap className="spinning" size={16} />
                      Deploying to {testMode ? 'Mumbai Testnet' : 'Polygon'}...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      Deploy Escrow Contract
                    </>
                  )}
                </button>
                
                {!isAddressValid && contractAddress && (
                  <div className="error-message">
                    <Shield size={16} />
                    Invalid contract address format. Please check the address.
                  </div>
                )}
                
                {!contractAddress && (
                  <div className="error-message">
                    <Shield size={16} />
                    Please provide a contract address to deploy.
                  </div>
                )}
                
                {testMode && (
                  <div className="test-info">
                    <p>🧪 <strong>Test Mode Active</strong></p>
                    <p>• Using Mumbai testnet (free test tokens)</p>
                    <p>• No real money involved</p>
                    <p>• Get testnet MATIC: <a href="https://faucet.polygon.technology/" target="_blank" rel="noopener noreferrer">Polygon Faucet</a></p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="simple-contract">
            <div className="contract-section">
              <h4>📄 Contract Terms</h4>
              <div className="terms">
                {contract.explicacion}
              </div>
            </div>

            <div className="contract-section">
              <h4>📊 Contract Details</h4>
              <div className="contract-details">
                <p><strong>Total:</strong> {contract.contrato?.total}</p>
                <div className="milestones">
                  <h5>Milestones:</h5>
                  {contract.contrato?.milestones?.map((milestone, index) => (
                    <div key={index} className="milestone">
                      <span className="amount">{milestone.pago_parcial}</span>
                      <span className="description">{milestone.descripcion}</span>
                      <span className="deadline">{milestone.deadline}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="disclaimer">
          <Shield size={16} />
          <small>
            {contract.json?.disclaimer || 
             "Este es un borrador generado por GigChain.io. No constituye consejo legal. Cumple con MiCA/GDPR – consulta a un experto."}
          </small>
        </div>
      </div>
    </div>
  );
}

function WalletConnection() {
  const address = useAddress();
  const disconnect = useDisconnect();

  if (address) {
    return (
      <div className="wallet-connected">
        <span className="wallet-address">
          <Wallet size={16} />
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button onClick={disconnect} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connection">
      <ConnectWallet 
        theme="dark"
        modalTitle="Connect to GigChain"
        auth={{
          loginOptional: true
        }}
      />
      <div style={{ 
        fontSize: '12px', 
        color: '#64748b', 
        marginTop: '8px',
        textAlign: 'center'
      }}>
        La conexión de wallet es opcional para usar el chat
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ isOpen, toggleSidebar, currentView, setCurrentView }) {
  const address = useAddress();
  const disconnect = useDisconnect();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'contracts', label: 'Contratos', icon: FileText },
    { id: 'chat', label: 'Chat AI', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Zap size={24} />
          <span className="logo-text">GigChain.io</span>
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon size={20} />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {address && (
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <div className="user-name">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <div className="user-role">Usuario Conectado</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Marketplace Templates Component
function TemplatesView({ onTemplateSelected }) {
  const [templates, setTemplates] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' or 'my-templates'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample marketplace templates
  const marketplaceTemplates = [
    {
      id: 'web-dev-basic',
      name: 'Desarrollo Web Básico',
      description: 'Plantilla para sitios web corporativos simples',
      category: 'Desarrollo Web',
      price: 'Gratis',
      rating: 4.8,
      downloads: 1250,
      author: 'GigChain Team',
      thumbnail: '🌐',
      pricing: { type: 'fixed', amount: 2000, currency: 'USD' },
      timeline: { duration: 14, unit: 'days' },
      skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
      deliverables: ['Sitio web responsive', 'SEO básico', 'Formulario de contacto'],
      terms: ['Pago 50% inicial, 50% final', '2 revisiones incluidas', 'Soporte 30 días']
    },
    {
      id: 'ecommerce-pro',
      name: 'E-commerce Profesional',
      description: 'Tienda online completa con carrito y pagos',
      category: 'E-commerce',
      price: 'Gratis',
      rating: 4.9,
      downloads: 890,
      author: 'GigChain Team',
      thumbnail: '🛒',
      pricing: { type: 'fixed', amount: 5000, currency: 'USD' },
      timeline: { duration: 30, unit: 'days' },
      skills: ['React', 'Node.js', 'Stripe', 'MongoDB'],
      deliverables: ['Tienda completa', 'Panel admin', 'Integración pagos', 'Analytics'],
      terms: ['Pago por milestones', '3 revisiones por milestone', 'Soporte 90 días']
    },
    {
      id: 'mobile-app',
      name: 'App Móvil Nativa',
      description: 'Aplicación móvil para iOS y Android',
      category: 'Mobile',
      price: 'Gratis',
      rating: 4.7,
      downloads: 650,
      author: 'GigChain Team',
      thumbnail: '📱',
      pricing: { type: 'hourly', amount: 75, currency: 'USD' },
      timeline: { duration: 45, unit: 'days' },
      skills: ['React Native', 'iOS', 'Android', 'Firebase'],
      deliverables: ['App iOS y Android', 'Backend API', 'Push notifications', 'App Store deployment'],
      terms: ['Pago semanal', 'Testing en dispositivos reales', 'Soporte 60 días']
    },
    {
      id: 'blockchain-dapp',
      name: 'DApp Blockchain',
      description: 'Aplicación descentralizada con contratos inteligentes',
      category: 'Blockchain',
      price: 'Gratis',
      rating: 4.9,
      downloads: 320,
      author: 'GigChain Team',
      thumbnail: '⛓️',
      pricing: { type: 'fixed', amount: 8000, currency: 'USD' },
      timeline: { duration: 60, unit: 'days' },
      skills: ['Solidity', 'Web3.js', 'React', 'Ethereum'],
      deliverables: ['Smart contracts', 'Frontend DApp', 'Testing suite', 'Documentación'],
      terms: ['Pago por fases', 'Auditoría de seguridad', 'Soporte 120 días']
    },
    {
      id: 'ui-ux-design',
      name: 'Diseño UI/UX Completo',
      description: 'Diseño de interfaz y experiencia de usuario',
      category: 'Diseño',
      price: 'Gratis',
      rating: 4.6,
      downloads: 980,
      author: 'GigChain Team',
      thumbnail: '🎨',
      pricing: { type: 'fixed', amount: 3000, currency: 'USD' },
      timeline: { duration: 21, unit: 'days' },
      skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
      deliverables: ['Wireframes', 'Mockups', 'Prototipo interactivo', 'Design system'],
      terms: ['Pago 40% inicial, 60% final', 'Revisiones ilimitadas', 'Archivos fuente incluidos']
    },
    {
      id: 'data-analytics',
      name: 'Dashboard de Analytics',
      description: 'Sistema de análisis de datos con visualizaciones',
      category: 'Data Science',
      price: 'Gratis',
      rating: 4.8,
      downloads: 450,
      author: 'GigChain Team',
      thumbnail: '📊',
      pricing: { type: 'fixed', amount: 6000, currency: 'USD' },
      timeline: { duration: 35, unit: 'days' },
      skills: ['Python', 'React', 'D3.js', 'PostgreSQL'],
      deliverables: ['Dashboard interactivo', 'API de datos', 'Reportes automáticos', 'Documentación técnica'],
      terms: ['Pago por milestones', 'Integración con sistemas existentes', 'Soporte 90 días']
    },
    {
      id: 'ai-chatbot',
      name: 'Chatbot con IA',
      description: 'Asistente virtual inteligente con procesamiento de lenguaje natural',
      category: 'Inteligencia Artificial',
      price: 'Gratis',
      rating: 4.9,
      downloads: 720,
      author: 'GigChain Team',
      thumbnail: '🤖',
      pricing: { type: 'fixed', amount: 4500, currency: 'USD' },
      timeline: { duration: 25, unit: 'days' },
      skills: ['Python', 'OpenAI API', 'FastAPI', 'WebSocket'],
      deliverables: ['Chatbot funcional', 'Panel de administración', 'Integración con APIs', 'Análisis de conversaciones'],
      terms: ['Pago 40% inicial, 60% final', 'Entrenamiento personalizado', 'Soporte 60 días']
    },
    {
      id: 'crypto-wallet',
      name: 'Wallet Criptomonedas',
      description: 'Billetera digital para múltiples criptomonedas con seguridad avanzada',
      category: 'Blockchain',
      price: 'Gratis',
      rating: 4.7,
      downloads: 380,
      author: 'GigChain Team',
      thumbnail: '💰',
      pricing: { type: 'fixed', amount: 12000, currency: 'USD' },
      timeline: { duration: 50, unit: 'days' },
      skills: ['React Native', 'Web3.js', 'Solidity', 'Hardware Security'],
      deliverables: ['App móvil segura', 'Soporte múltiples tokens', 'Backup y recuperación', 'Auditoría de seguridad'],
      terms: ['Pago por fases', 'Testing exhaustivo', 'Soporte 180 días']
    },
    {
      id: 'video-streaming',
      name: 'Plataforma de Streaming',
      description: 'Sistema completo de transmisión de video en tiempo real',
      category: 'Media',
      price: 'Gratis',
      rating: 4.6,
      downloads: 290,
      author: 'GigChain Team',
      thumbnail: '🎥',
      pricing: { type: 'fixed', amount: 15000, currency: 'USD' },
      timeline: { duration: 60, unit: 'days' },
      skills: ['Node.js', 'WebRTC', 'FFmpeg', 'AWS'],
      deliverables: ['Plataforma streaming', 'CDN integrado', 'Sistema de pagos', 'Analytics de audiencia'],
      terms: ['Pago por milestones', 'Infraestructura incluida', 'Soporte 120 días']
    },
    {
      id: 'e-learning',
      name: 'Plataforma E-Learning',
      description: 'Sistema completo de educación online con cursos y certificaciones',
      category: 'Educación',
      price: 'Gratis',
      rating: 4.8,
      downloads: 650,
      author: 'GigChain Team',
      thumbnail: '🎓',
      pricing: { type: 'fixed', amount: 8000, currency: 'USD' },
      timeline: { duration: 45, unit: 'days' },
      skills: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      deliverables: ['Plataforma completa', 'Sistema de pagos', 'Certificaciones', 'Panel de instructor'],
      terms: ['Pago 50% inicial, 50% final', 'Hosting incluido', 'Soporte 90 días']
    },
    {
      id: 'real-estate',
      name: 'Portal Inmobiliario',
      description: 'Plataforma completa para gestión y venta de propiedades',
      category: 'Real Estate',
      price: 'Gratis',
      rating: 4.5,
      downloads: 420,
      author: 'GigChain Team',
      thumbnail: '🏠',
      pricing: { type: 'fixed', amount: 7000, currency: 'USD' },
      timeline: { duration: 40, unit: 'days' },
      skills: ['Vue.js', 'Laravel', 'MySQL', 'Google Maps API'],
      deliverables: ['Portal web completo', 'App móvil', 'Sistema de búsqueda', 'Gestión de agentes'],
      terms: ['Pago por fases', 'Integración con MLS', 'Soporte 90 días']
    },
    {
      id: 'healthcare-app',
      name: 'App de Salud',
      description: 'Aplicación médica con citas, historiales y telemedicina',
      category: 'Salud',
      price: 'Gratis',
      rating: 4.9,
      downloads: 180,
      author: 'GigChain Team',
      thumbnail: '🏥',
      pricing: { type: 'fixed', amount: 18000, currency: 'USD' },
      timeline: { duration: 70, unit: 'days' },
      skills: ['Flutter', 'Firebase', 'HIPAA Compliance', 'WebRTC'],
      deliverables: ['App móvil completa', 'Panel web', 'Sistema de citas', 'Video consultas'],
      terms: ['Pago por milestones', 'Cumplimiento HIPAA', 'Soporte 120 días']
    },
    {
      id: 'food-delivery',
      name: 'App de Delivery',
      description: 'Plataforma completa de entrega de comida con múltiples restaurantes',
      category: 'Food & Beverage',
      price: 'Gratis',
      rating: 4.7,
      downloads: 890,
      author: 'GigChain Team',
      thumbnail: '🍕',
      pricing: { type: 'fixed', amount: 10000, currency: 'USD' },
      timeline: { duration: 50, unit: 'days' },
      skills: ['React Native', 'Node.js', 'MongoDB', 'Google Maps'],
      deliverables: ['App cliente y repartidor', 'Panel restaurante', 'Sistema de pagos', 'Tracking en tiempo real'],
      terms: ['Pago 40% inicial, 60% final', 'Comisión incluida', 'Soporte 90 días']
    },
    {
      id: 'fitness-tracker',
      name: 'Tracker de Fitness',
      description: 'Aplicación de seguimiento de ejercicios y salud personal',
      category: 'Fitness',
      price: 'Gratis',
      rating: 4.6,
      downloads: 560,
      author: 'GigChain Team',
      thumbnail: '💪',
      pricing: { type: 'fixed', amount: 5500, currency: 'USD' },
      timeline: { duration: 30, unit: 'days' },
      skills: ['React Native', 'HealthKit', 'Google Fit', 'Charts.js'],
      deliverables: ['App móvil', 'Sincronización wearables', 'Estadísticas detalladas', 'Planes de entrenamiento'],
      terms: ['Pago 50% inicial, 50% final', 'Integración wearables', 'Soporte 60 días']
    },
    {
      id: 'social-network',
      name: 'Red Social',
      description: 'Plataforma social con perfiles, posts y mensajería',
      category: 'Social Media',
      price: 'Gratis',
      rating: 4.4,
      downloads: 320,
      author: 'GigChain Team',
      thumbnail: '👥',
      pricing: { type: 'fixed', amount: 12000, currency: 'USD' },
      timeline: { duration: 55, unit: 'days' },
      skills: ['React', 'Node.js', 'Socket.io', 'AWS S3'],
      deliverables: ['Plataforma web', 'App móvil', 'Sistema de mensajería', 'Moderación de contenido'],
      terms: ['Pago por fases', 'Escalabilidad incluida', 'Soporte 90 días']
    },
    {
      id: 'booking-system',
      name: 'Sistema de Reservas',
      description: 'Plataforma de reservas para hoteles, restaurantes y servicios',
      category: 'Hospitalidad',
      price: 'Gratis',
      rating: 4.8,
      downloads: 480,
      author: 'GigChain Team',
      thumbnail: '📅',
      pricing: { type: 'fixed', amount: 6500, currency: 'USD' },
      timeline: { duration: 35, unit: 'days' },
      skills: ['Vue.js', 'Laravel', 'MySQL', 'Stripe'],
      deliverables: ['Sistema web completo', 'App móvil', 'Panel de administración', 'Sistema de pagos'],
      terms: ['Pago 40% inicial, 60% final', 'Integración calendarios', 'Soporte 90 días']
    },
    {
      id: 'crm-system',
      name: 'Sistema CRM',
      description: 'Gestión de relaciones con clientes y ventas',
      category: 'Business',
      price: 'Gratis',
      rating: 4.7,
      downloads: 750,
      author: 'GigChain Team',
      thumbnail: '📈',
      pricing: { type: 'fixed', amount: 9000, currency: 'USD' },
      timeline: { duration: 45, unit: 'days' },
      skills: ['Angular', 'Spring Boot', 'PostgreSQL', 'Redis'],
      deliverables: ['Dashboard completo', 'Gestión de leads', 'Automatización', 'Reportes avanzados'],
      terms: ['Pago por milestones', 'Integración APIs', 'Soporte 120 días']
    }
  ];

  // Load user templates from localStorage
  React.useEffect(() => {
    const loadTemplates = () => {
      try {
        const savedTemplates = localStorage.getItem('gigchain-templates');
        const templatesData = savedTemplates ? JSON.parse(savedTemplates) : [];
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };

    loadTemplates();
  }, []);

  // Download template example
  const downloadTemplateExample = () => {
    const exampleTemplate = {
      name: "Mi Plantilla Personalizada",
      description: "Descripción del proyecto o servicio",
      category: "Desarrollo",
      projectType: "Web Development",
      skills: ["React", "Node.js", "MongoDB"],
      pricing: {
        type: "fixed", // "fixed", "hourly", "milestone"
        amount: 5000,
        currency: "USD"
      },
      timeline: {
        duration: 30,
        unit: "days"
      },
      deliverables: [
        "Código fuente completo",
        "Documentación técnica",
        "Testing y QA"
      ],
      terms: [
        "Pago 50% al inicio, 50% al finalizar",
        "Revisiones ilimitadas durante desarrollo",
        "Soporte 30 días post-entrega"
      ],
      createdAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exampleTemplate, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'template-ejemplo-gigchain.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Upload template with backend validation
  const handleTemplateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 1MB permitido.');
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      alert('Solo se permiten archivos JSON.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const templateJson = e.target.result;
        
        // Validate with backend first
        const validationResponse = await fetch('/api/templates/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_json: templateJson,
            user_id: 'frontend-user' // In production, use actual user ID
          })
        });

        const validationResult = await validationResponse.json();

        if (!validationResult.valid) {
          throw new Error(`Plantilla no válida: ${validationResult.errors.join(', ')}`);
        }

        if (validationResult.security_score < 70) {
          throw new Error(`Puntuación de seguridad insuficiente: ${validationResult.security_score}/100`);
        }

        // Use sanitized template from backend
        const sanitizedTemplate = validationResult.sanitized_template;
        
        // Add unique ID and timestamp
        const newTemplate = {
          ...sanitizedTemplate,
          id: Date.now().toString(),
          uploadedAt: new Date().toISOString(),
          securityValidated: true,
          securityScore: validationResult.security_score
        };

        const updatedTemplates = [...templates, newTemplate];
        setTemplates(updatedTemplates);
        localStorage.setItem('gigchain-templates', JSON.stringify(updatedTemplates));
        
        setShowUpload(false);
        setUploading(false);
        
        // Show success message with security info
        alert(`Plantilla subida exitosamente!\nPuntuación de seguridad: ${validationResult.security_score}/100`);
        
        // Reset file input
        event.target.value = '';
        
      } catch (error) {
        console.error('Error processing template:', error);
        alert('Error al procesar la plantilla: ' + error.message);
        setUploading(false);
      }
    };

    reader.readAsText(file);
  };

  // Use template
  const useTemplate = (template) => {
    if (onTemplateSelected) {
      onTemplateSelected(template);
    }
  };

  // Delete template
  const deleteTemplate = (templateId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem('gigchain-templates', JSON.stringify(updatedTemplates));
    }
  };

  // Handle template preview
  const previewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  // Handle carousel navigation
  const nextSlide = () => {
    const maxSlides = Math.ceil(marketplaceTemplates.length / 3) - 1;
    setCurrentSlide(prev => prev < maxSlides ? prev + 1 : 0);
  };

  const prevSlide = () => {
    const maxSlides = Math.ceil(marketplaceTemplates.length / 3) - 1;
    setCurrentSlide(prev => prev > 0 ? prev - 1 : maxSlides);
  };

  // Get current slide templates
  const getCurrentSlideTemplates = () => {
    const start = currentSlide * 3;
    const end = start + 3;
    return marketplaceTemplates.slice(start, end);
  };

  return (
    <div className="templates-view">
      <div className="templates-header">
        <div className="header-content">
          <div className="header-text">
            <h2>Marketplace de Plantillas</h2>
            <p>Explora plantillas profesionales y crea las tuyas propias</p>
          </div>
          <div className="header-actions">
            <button 
              className="download-template-btn"
              onClick={downloadTemplateExample}
            >
              <FileText size={18} />
              <span>Descargar Ejemplo</span>
            </button>
            <button 
              className="upload-template-btn"
              onClick={() => document.getElementById('template-upload').click()}
              disabled={uploading}
            >
              <Zap size={18} />
              <span>{uploading ? 'Subiendo...' : 'Subir Plantilla'}</span>
            </button>
            <input
              id="template-upload"
              type="file"
              accept=".json"
              onChange={handleTemplateUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="templates-tabs">
        <button 
          className={`tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          <Zap size={18} />
          Marketplace
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-templates')}
        >
          <FileText size={18} />
          Mis Plantillas
        </button>
      </div>

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="marketplace-section">
          <div className="carousel-container">
            <button className="carousel-btn prev" onClick={prevSlide}>
              <Zap size={20} />
            </button>
            
            <div className="carousel-track">
              <div 
                className="carousel-slide"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {marketplaceTemplates.map(template => (
                  <div key={template.id} className="marketplace-template-card">
                    <div className="template-thumbnail">
                      <div className="thumbnail-icon">{template.thumbnail}</div>
                      <div className="template-price">{template.price}</div>
                    </div>
                    
                    <div className="template-info">
                      <div className="template-category">{template.category}</div>
                      <h3>{template.name}</h3>
                      <p>{template.description}</p>
                      
                      <div className="template-stats">
                        <div className="stat">
                          <Star size={14} />
                          <span>{template.rating}</span>
                        </div>
                        <div className="stat">
                          <FileText size={14} />
                          <span>{template.downloads} descargas</span>
                        </div>
                      </div>
                      
                      <div className="template-skills">
                        {template.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                        {template.skills.length > 3 && (
                          <span className="skill-tag">+{template.skills.length - 3}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="template-actions">
                      <button 
                        className="preview-btn"
                        onClick={() => previewTemplate(template)}
                      >
                        <Eye size={16} />
                        Ver Detalles
                      </button>
                      <button 
                        className="use-btn"
                        onClick={() => useTemplate(template)}
                      >
                        <Zap size={16} />
                        Usar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="carousel-btn next" onClick={nextSlide}>
              <Zap size={20} />
            </button>
          </div>
          
          <div className="carousel-dots">
            {Array.from({ length: Math.ceil(marketplaceTemplates.length / 3) }).map((_, index) => (
              <button
                key={index}
                className={`dot ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* My Templates Tab */}
      {activeTab === 'my-templates' && (
        <div className="my-templates-section">
          {templates.length === 0 ? (
            <div className="empty-templates">
              <div className="empty-content">
                <FileText size={64} className="empty-icon" />
                <h3>No tienes plantillas personalizadas</h3>
                <p>Descarga el ejemplo, personalízalo y súbelo para comenzar a crear tus propias plantillas</p>
                <div className="empty-actions">
                  <button 
                    className="btn-primary"
                    onClick={downloadTemplateExample}
                  >
                    <FileText size={16} />
                    Descargar Ejemplo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="templates-grid">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <div className="template-category">{template.category || 'Personalizada'}</div>
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                  </div>
                  
                  <div className="template-details">
                    {template.pricing && (
                      <div className="detail-item">
                        <span className="label">Precio:</span>
                        <span className="value">
                          {template.pricing.type === 'fixed' ? '$' + template.pricing.amount :
                           template.pricing.type === 'hourly' ? '$' + template.pricing.amount + '/hora' :
                           'Por milestones'}
                        </span>
                      </div>
                    )}
                    {template.timeline && (
                      <div className="detail-item">
                        <span className="label">Duración:</span>
                        <span className="value">{template.timeline.duration} {template.timeline.unit}</span>
                      </div>
                    )}
                  </div>

                  {template.skills && template.skills.length > 0 && (
                    <div className="template-skills">
                      {template.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="template-actions">
                    <button 
                      className="use-template-btn"
                      onClick={() => useTemplate(template)}
                    >
                      <FileText size={16} />
                      Usar Plantilla
                    </button>
                    <button 
                      className="delete-template-btn"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Shield size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      {showModal && selectedTemplate && (
        <div className="template-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-thumbnail">
                <div className="thumbnail-icon">{selectedTemplate.thumbnail}</div>
              </div>
              <div className="modal-info">
                <div className="modal-category">{selectedTemplate.category}</div>
                <h2>{selectedTemplate.name}</h2>
                <p>{selectedTemplate.description}</p>
                <div className="modal-stats">
                  <div className="stat">
                    <Star size={16} />
                    <span>{selectedTemplate.rating}</span>
                  </div>
                  <div className="stat">
                    <FileText size={16} />
                    <span>{selectedTemplate.downloads} descargas</span>
                  </div>
                  <div className="stat">
                    <User size={16} />
                    <span>por {selectedTemplate.author}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <Shield size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="modal-section">
                <h3>Detalles del Proyecto</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Precio:</span>
                    <span className="value">
                      {selectedTemplate.pricing.type === 'fixed' ? '$' + selectedTemplate.pricing.amount :
                       selectedTemplate.pricing.type === 'hourly' ? '$' + selectedTemplate.pricing.amount + '/hora' :
                       'Por milestones'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Duración:</span>
                    <span className="value">{selectedTemplate.timeline.duration} {selectedTemplate.timeline.unit}</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-section">
                <h3>Habilidades Requeridas</h3>
                <div className="skills-grid">
                  {selectedTemplate.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
              
              <div className="modal-section">
                <h3>Entregables</h3>
                <ul className="deliverables-list">
                  {selectedTemplate.deliverables.map((deliverable, index) => (
                    <li key={index}>{deliverable}</li>
                  ))}
                </ul>
              </div>
              
              <div className="modal-section">
                <h3>Términos y Condiciones</h3>
                <ul className="terms-list">
                  {selectedTemplate.terms.map((term, index) => (
                    <li key={index}>{term}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="modal-use-btn" onClick={() => {
                useTemplate(selectedTemplate);
                setShowModal(false);
              }}>
                <Zap size={18} />
                Usar Esta Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// History Component
function HistoryView({ filters, onFilterChange, contracts = [] }) {

  return (
    <div className="history-view">
      <div className="history-header">
        <h2>Historial de Contratos</h2>
        <p>Gestiona y revisa todos tus contratos pasados y actuales</p>
      </div>

      <div className="history-filters">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filters.status === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('status', 'all')}
          >
            Todos
          </button>
          <button 
            className={`filter-btn ${filters.status === 'en-progreso' ? 'active' : ''}`}
            onClick={() => onFilterChange('status', 'en-progreso')}
          >
            Activos
          </button>
          <button 
            className={`filter-btn ${filters.status === 'completado' ? 'active' : ''}`}
            onClick={() => onFilterChange('status', 'completado')}
          >
            Completados
          </button>
          <button 
            className={`filter-btn ${filters.status === 'pendiente' ? 'active' : ''}`}
            onClick={() => onFilterChange('status', 'pendiente')}
          >
            Pendientes
          </button>
        </div>
      </div>

      <div className="contracts-list">
        {contracts.length > 0 ? (
          contracts
            .filter(contract => {
              if (filters.status === 'all') return true;
              const statusMap = {
                'en-progreso': ['active', 'in-progress'],
                'completado': ['completed'],
                'pendiente': ['pending']
              };
              return statusMap[filters.status]?.includes(contract.status) || false;
            })
            .map(contract => (
            <div key={contract.id} className="contract-item">
              <div className="contract-info">
                <div className="contract-main">
                  <h3>{contract.title}</h3>
                  <p className="contract-client">{contract.role === 'freelancer' ? 'Como Freelancer' : 'Como Cliente'}</p>
                </div>
                <div className="contract-meta">
                  <div className="contract-amount">${contract.amount?.toLocaleString() || '0'}</div>
                  <div className={`contract-status ${contract.status.toLowerCase().replace(' ', '-')}`}>
                    {contract.status === 'active' ? 'Activo' :
                     contract.status === 'completed' ? 'Completado' :
                     contract.status === 'pending' ? 'Pendiente' : contract.status}
                  </div>
                </div>
              </div>
              
              <div className="contract-details">
                <div className="contract-type">
                  <span className="type-badge">{contract.role === 'freelancer' ? 'Freelancer' : 'Cliente'}</span>
                </div>
                <div className="contract-date">
                  {new Date(contract.createdAt).toLocaleDateString('es-ES')}
                </div>
              </div>

              <div className="contract-actions">
                <button className="action-btn secondary">
                  <FileText size={16} />
                  Ver
                </button>
                <button className="action-btn primary">
                  <Zap size={16} />
                  Editar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-contracts">
            <p>No tienes contratos aún. ¡Crea tu primer contrato para comenzar!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Component
function DashboardView({ metrics }) {
  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Contratos Activos</h3>
          <div className="card-content">
            <div className="card-number">{metrics.activeContracts}</div>
            <div className="card-label">En progreso</div>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>Ganancias Totales</h3>
          <div className="card-content">
            <div className="card-number">${metrics.totalEarnings.toLocaleString()}</div>
            <div className="card-label">Este mes</div>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>Rating Promedio</h3>
          <div className="card-content">
            <div className="card-number">{metrics.averageRating || 'N/A'}</div>
            <div className="card-label">Estrellas</div>
          </div>
        </div>
        <div className="dashboard-card">
          <h3>Proyectos Completados</h3>
          <div className="card-content">
            <div className="card-number">{metrics.completedProjects}</div>
            <div className="card-label">Este año</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Actividad Reciente</h2>
        <div className="activity-list">
          {metrics.recentActivity.length > 0 ? (
            metrics.recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'payment' ? <Zap size={20} /> :
                   activity.type === 'contract' ? <FileText size={20} /> :
                   <MessageSquare size={20} />}
                </div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>{activity.description}</p>
                  <div className="activity-time">{activity.timeAgo}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No hay actividad reciente. ¡Crea tu primer contrato para comenzar!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Content Component
function MainContent({ currentView, isSidebarOpen }) {
  const [contractsView, setContractsView] = useState('form'); // 'form', 'templates', 'history'
  const [contractFilters, setContractFilters] = useState({
    status: 'all',
    type: 'all'
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Use dashboard metrics hook
  const { metrics, contracts, addContract, updateContractStatus } = useDashboardMetrics();

  // Handle template selection
  const handleTemplateSelected = (template) => {
    setSelectedTemplate(template);
    setContractsView('form'); // Switch to form view
  };

  const handleFilterChange = (filterType, value) => {
    setContractFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView metrics={metrics} />;

      case 'contracts':
        return (
          <div className="contracts-page">
            {/* Header with Stats */}
            <div className="contracts-header">
              <div className="header-content">
                <div className="header-text">
                  <h2>Gestión de Contratos</h2>
                  <p>Crea, gestiona y hace seguimiento de todos tus contratos inteligentes con IA</p>
                </div>
                <div className="header-actions">
                  <button 
                    className="create-contract-btn"
                    onClick={() => setContractsView('form')}
                  >
                    <FileText size={20} />
                    <span>Nuevo Contrato</span>
                  </button>
                </div>
                <div className="header-stats">
                  <div className="stat-item">
                    <div className="stat-number">{metrics.activeContracts}</div>
                    <div className="stat-label">Activos</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{metrics.completedProjects}</div>
                    <div className="stat-label">Completados</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">${metrics.totalEarnings.toLocaleString()}</div>
                    <div className="stat-label">Total</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="contracts-navigation">
              <div className="nav-tabs">
                <button 
                  className={`nav-tab ${contractsView === 'form' ? 'active' : ''}`}
                  onClick={() => setContractsView('form')}
                >
                  <FileText size={18} />
                  <span>Nuevo Contrato</span>
                </button>
                <button 
                  className={`nav-tab ${contractsView === 'templates' ? 'active' : ''}`}
                  onClick={() => setContractsView('templates')}
                >
                  <Zap size={18} />
                  <span>Plantillas</span>
                </button>
                <button 
                  className={`nav-tab ${contractsView === 'history' ? 'active' : ''}`}
                  onClick={() => setContractsView('history')}
                >
                  <Shield size={18} />
                  <span>Historial</span>
                </button>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="contracts-main-content">
              {contractsView === 'form' && (
                <ContractForm 
                  onContractCreated={addContract} 
                  selectedTemplate={selectedTemplate}
                />
              )}
              {contractsView === 'templates' && (
                <TemplatesView onTemplateSelected={handleTemplateSelected} />
              )}
              {contractsView === 'history' && (
                <HistoryView 
                  filters={contractFilters}
                  onFilterChange={handleFilterChange}
                  contracts={contracts}
                />
              )}
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="view-container">
            <ChatView />
          </div>
        );

      case 'analytics':
        return (
          <div className="view-container">
            <h2>Analytics y Reportes</h2>
            <p>Visualiza estadísticas detalladas sobre tu actividad y rendimiento.</p>
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '2rem', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Los analytics estarán disponibles próximamente</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="view-container">
            <h2>Configuración</h2>
            <p>Personaliza tu experiencia y gestiona tus preferencias.</p>
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '2rem', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Settings size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Las configuraciones estarán disponibles próximamente</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="view-container">
            <h2>Bienvenido a GigChain.io</h2>
            <p>Selecciona una opción del menú para comenzar.</p>
          </div>
        );
    }
  };

  return (
    <div className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <div className="content-header">
        <h1 className="page-title">
          {currentView === 'dashboard' && 'Dashboard'}
          {currentView === 'contracts' && 'Contratos'}
          {currentView === 'chat' && 'Chat AI'}
          {currentView === 'analytics' && 'Analytics'}
          {currentView === 'settings' && 'Configuración'}
        </h1>
        <div className="header-right">
          <div className="search-bar">
            <input type="text" placeholder="Buscar..." />
          </div>
          <button className="notification-btn">
            <Shield size={20} />
          </button>
          <div className="wallet-connection">
            <WalletConnection />
          </div>
        </div>
      </div>

      <div className="content-body">
        {renderContent()}
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ThirdwebProvider 
      activeChain={Mumbai}
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || "your-thirdweb-client-id"}
      supportedChains={[Mumbai, Polygon]}
    >
      <div className="app-layout">
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        {isSidebarOpen && isMobile && (
          <div className="sidebar-overlay" onClick={toggleSidebar}></div>
        )}
        <MainContent 
          currentView={currentView} 
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    </ThirdwebProvider>
  );
}

// Chat View Component
function ChatView() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('contract');
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Initialize chat session
  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      setError(null);
      
      // Get available agents
      const agentsResponse = await fetch(`${API_BASE_URL}/api/chat/agents`);
      if (!agentsResponse.ok) {
        throw new Error(`HTTP error! status: ${agentsResponse.status}`);
      }
      const agentsData = await agentsResponse.json();
      setAvailableAgents(agentsData.agents || []);

      // Create new session
      const sessionResponse = await fetch(`${API_BASE_URL}/api/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'frontend-user',
          agent_type: selectedAgent
        })
      });
      
      if (!sessionResponse.ok) {
        throw new Error(`HTTP error! status: ${sessionResponse.status}`);
      }
      
      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.session_id);
      setIsConnected(true);

      // Add welcome message
      const welcomeMessage = {
        id: Date.now(),
        role: 'assistant',
        content: '¡Hola! Soy tu asistente de IA para GigChain.io. ¿En qué puedo ayudarte hoy? Puedo ayudarte con contratos, negociaciones, soporte técnico o consejos de negocio.',
        timestamp: new Date().toISOString(),
        agent_type: 'contract'
      };
      setMessages([welcomeMessage]);

    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Error conectando con el servidor de chat. Verifica que el backend esté ejecutándose.');
      setIsConnected(false);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        role: 'assistant',
        content: 'Lo siento, no puedo conectarme al servidor de chat en este momento. Por favor, verifica que el backend esté ejecutándose (python main.py) e inténtalo de nuevo.',
        timestamp: new Date().toISOString(),
        agent_type: 'error'
      };
      setMessages([errorMessage]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          session_id: sessionId,
          user_id: 'frontend-user',
          context: {
            current_view: 'chat',
            platform: 'gigchain'
          }
        })
      });

      const data = await response.json();
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        agent_type: data.agent_type,
        suggestions: data.suggestions || []
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Lo siento, hubo un error procesando tu mensaje. Por favor, inténtalo de nuevo.',
        timestamp: new Date().toISOString(),
        agent_type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchAgent = async (agentType) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/session/${sessionId}/agent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agent_type: agentType })
      });

      if (response.ok) {
        setSelectedAgent(agentType);
        
        // Add system message about agent switch
        const switchMessage = {
          id: Date.now(),
          role: 'assistant',
          content: `He cambiado a ${availableAgents.find(a => a.id === agentType)?.name || agentType}. ¿En qué puedo ayudarte?`,
          timestamp: new Date().toISOString(),
          agent_type: agentType
        };
        setMessages(prev => [...prev, switchMessage]);
      }
    } catch (error) {
      console.error('Error switching agent:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="chat-title">
          <MessageSquare size={24} />
          <h2>Chat con IA</h2>
        </div>
        
        <div className="chat-controls">
          <div className="agent-selector">
            <label>Agente:</label>
            <select 
              value={selectedAgent} 
              onChange={(e) => switchAgent(e.target.value)}
              disabled={!isConnected}
            >
              {availableAgents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
            {!isConnected && (
              <button 
                onClick={initializeChat}
                className="reconnect-btn"
                style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reconectar
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="chat-error" style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          margin: '10px',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? 'Tú' : 'IA'}
                  </span>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-text">
                  {message.content}
                </div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="message-suggestions">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-btn"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <div className="chat-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje aquí..."
              disabled={!isConnected || isLoading}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !isConnected || isLoading}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
