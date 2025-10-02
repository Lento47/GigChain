import React, { useState } from 'react';
import { ThirdwebProvider, ConnectWallet, useContract, useContractWrite } from '@thirdweb-dev/react';
import axios from 'axios';
import { Wallet, FileText, Zap, Shield } from 'lucide-react';
import './App.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ContractForm() {
  const [input, setInput] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/full_flow`, {
        text: input
      });
      
      setContract(response.data);
    } catch (err) {
      console.error('API error:', err);
      setError(err.response?.data?.detail || 'Error generating contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contract-form">
      <form onSubmit={handleSubmit}>
        <div className="input-section">
          <label htmlFor="contract-input">
            <FileText size={20} />
            Describe your gig contract
          </label>
          <textarea
            id="contract-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: Freelancer ofrezco $2000 dolares para desarrollo web. Cliente solicita $5000 dolares. Proyecto complejo de 20 días."
            rows={4}
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? (
            <>
              <Zap className="spinning" size={16} />
              Generating AI Contract...
            </>
          ) : (
            <>
              <Zap size={16} />
              Generate Smart Contract
            </>
          )}
        </button>
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
  const { contract: thirdwebContract } = useContract(contract.json?.escrow_params?.contract_address);
  const { mutate: deployContract, isLoading: isDeploying } = useContractWrite(thirdwebContract, "deploy");

  const handleDeployEscrow = () => {
    if (contract.json?.escrow_params) {
      // Deploy escrow contract with milestones
      deployContract({
        args: [
          contract.json.escrow_params.token,
          contract.json.escrow_params.milestones
        ]
      });
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
                <button 
                  onClick={handleDeployEscrow}
                  disabled={isDeploying}
                  className="deploy-button"
                >
                  {isDeploying ? (
                    <>
                      <Zap className="spinning" size={16} />
                      Deploying to Polygon...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      Deploy Escrow Contract
                    </>
                  )}
                </button>
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

function App() {
  return (
    <ThirdwebProvider 
      activeChain="polygon"
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
    >
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <Zap size={32} />
              <h1>GigChain.io</h1>
            </div>
            <div className="header-subtitle">
              AI-Powered Web3 Contract Generation
            </div>
          </div>
          <ConnectWallet 
            theme="dark"
            modalTitle="Connect to GigChain"
            modalTitleIcon=""
          />
        </header>

        <main className="app-main">
          <div className="hero-section">
            <h2>Generate Smart Contracts with AI</h2>
            <p>
              Create blockchain-secured contracts for the gig economy. 
              AI agents negotiate terms, generate legal clauses, and deploy escrow on Polygon.
            </p>
          </div>

          <ContractForm />
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>
              Built with AI agents • Powered by OpenAI • Secured by Polygon
            </p>
            <div className="footer-links">
              <a href="/docs" target="_blank">API Docs</a>
              <a href="/health" target="_blank">Health Check</a>
              <a href="https://github.com/Lento47/GigChain" target="_blank">GitHub</a>
            </div>
          </div>
        </footer>
      </div>
    </ThirdwebProvider>
  );
}

export default App;
