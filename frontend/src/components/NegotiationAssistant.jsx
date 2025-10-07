import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, AlertTriangle, TrendingUp, MessageSquare, X, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const NegotiationAssistant = ({ 
  contractText, 
  offeredAmount, 
  userId, 
  contractId,
  onAccept,
  onNegotiate,
  onClose 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState(null);
  const [highlightAnalysis, setHighlightAnalysis] = useState(null);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [counterOfferData, setCounterOfferData] = useState(null);

  useEffect(() => {
    analyzeContract();
  }, [contractText, offeredAmount]);

  const analyzeContract = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/gamification/contracts/analyze`, {
        contract_text: contractText,
        offered_amount: offeredAmount,
        user_id: userId,
        contract_id: contractId
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 5) {
      setSelectedText(text);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/gamification/contracts/highlight-analysis`, {
          highlighted_text: text,
          full_context: contractText,
          user_id: userId,
          contract_id: contractId
        });
        setHighlightAnalysis(response.data);
      } catch (error) {
        console.error('Error analyzing highlight:', error);
      }
    }
  };

  const handleNegotiate = async () => {
    setShowCounterOffer(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/gamification/contracts/counter-offer`, {
        contract_id: contractId,
        user_id: userId,
        original_offer: offeredAmount,
        project_complexity: 'medium' // This should come from analysis
      });
      setCounterOfferData(response.data);
    } catch (error) {
      console.error('Error generating counter offer:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>AI is analyzing your contract...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const { overall_assessment, insights, negotiation_strategy, learning_opportunities, red_flags, green_flags } = analysis;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Brain size={24} style={{ color: '#8b5cf6' }} />
            <h2 style={styles.title}>AI Negotiation Assistant</h2>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {/* Overall Assessment */}
        <div style={{
          ...styles.assessmentCard,
          borderLeft: `4px solid ${getRecommendationColor(overall_assessment.recommendation)}`
        }}>
          <div style={styles.assessmentHeader}>
            <span style={styles.assessmentBadge}>
              {overall_assessment.value_rating.toUpperCase()}
            </span>
            <span style={styles.confidenceScore}>
              {overall_assessment.confidence.toFixed(0)}% Confidence
            </span>
          </div>
          <div style={styles.recommendation}>
            <strong>Recommendation:</strong> {overall_assessment.recommendation.toUpperCase()}
          </div>
          <div style={styles.riskLevel}>
            Risk Level: <span style={{ color: getRiskColor(overall_assessment.risk_level) }}>
              {overall_assessment.risk_level}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={styles.content}>
          
          {/* Contract Text with Highlight Detection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <MessageSquare size={18} />
              Contract Details (Select text for instant analysis)
            </h3>
            <div 
              style={styles.contractText}
              onMouseUp={handleTextSelection}
            >
              {contractText}
            </div>
            
            {/* Highlight Tooltip */}
            {highlightAnalysis && (
              <div style={styles.tooltip}>
                <div style={styles.tooltipHeader}>
                  <Lightbulb size={16} style={{ color: '#fbbf24' }} />
                  <strong>{highlightAnalysis.quick_tip}</strong>
                </div>
                <p style={styles.tooltipText}>{highlightAnalysis.explanation}</p>
                {highlightAnalysis.concerns && highlightAnalysis.concerns.length > 0 && (
                  <div style={styles.tooltipConcerns}>
                    <strong>⚠️ Watch out for:</strong>
                    <ul style={styles.tooltipList}>
                      {highlightAnalysis.concerns.map((concern, idx) => (
                        <li key={idx}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Key Insights */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Lightbulb size={18} />
              Key Insights
            </h3>
            <div style={styles.insightsGrid}>
              {insights.map((insight, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...styles.insightCard,
                    borderLeft: `3px solid ${getInsightColor(insight.severity)}`
                  }}
                >
                  <div style={styles.insightHeader}>
                    <span style={styles.insightType}>{insight.type.toUpperCase()}</span>
                    <span style={styles.insightSeverity}>{insight.severity}</span>
                  </div>
                  <div style={styles.insightTitle}>{insight.title}</div>
                  <div style={styles.insightMessage}>{insight.message}</div>
                  {insight.action_items && insight.action_items.length > 0 && (
                    <ul style={styles.actionItems}>
                      {insight.action_items.map((action, i) => (
                        <li key={i}><ChevronRight size={14} /> {action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Red Flags */}
          {red_flags && red_flags.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                Red Flags
              </h3>
              <div style={styles.flagsGrid}>
                {red_flags.map((flag, idx) => (
                  <div key={idx} style={styles.redFlag}>
                    <div style={styles.flagSeverity}>{flag.severity}</div>
                    <div style={styles.flagText}>{flag.flag}</div>
                    <div style={styles.flagMitigation}>💡 {flag.mitigation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Green Flags */}
          {green_flags && green_flags.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <TrendingUp size={18} style={{ color: '#10b981' }} />
                Positive Aspects
              </h3>
              <ul style={styles.greenFlagsList}>
                {green_flags.map((flag, idx) => (
                  <li key={idx} style={styles.greenFlag}>✅ {flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Opportunities */}
          {learning_opportunities && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <TrendingUp size={18} />
                How to Improve
              </h3>
              <div style={styles.learningCard}>
                <div style={styles.skillGaps}>
                  <strong>Skills to develop:</strong>
                  <div style={styles.skillTags}>
                    {learning_opportunities.skill_gaps.map((skill, idx) => (
                      <span key={idx} style={styles.skillTag}>{skill}</span>
                    ))}
                  </div>
                </div>
                <div style={styles.improvement}>
                  <strong>Expected improvement:</strong>
                  <p>{learning_opportunities.estimated_improvement}</p>
                </div>
              </div>
            </div>
          )}

          {/* Negotiation Strategy */}
          {showCounterOffer && counterOfferData && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                💼 Counter-Offer Strategy
              </h3>
              <div style={styles.counterOfferCard}>
                <div style={styles.offerAmount}>
                  <span style={styles.offerLabel}>Recommended Counter-Offer:</span>
                  <span style={styles.offerValue}>${counterOfferData.recommended_counter}</span>
                </div>
                <div style={styles.offerRange}>
                  Range: ${counterOfferData.calculated_range.min} - ${counterOfferData.calculated_range.max}
                </div>
                <div style={styles.justification}>
                  <strong>Why this amount:</strong>
                  <p>{counterOfferData.justification}</p>
                </div>
                <div style={styles.script}>
                  <strong>What to say:</strong>
                  <p style={styles.scriptText}>{counterOfferData.negotiation_script}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.footer}>
          <button 
            style={styles.acceptButton}
            onClick={() => onAccept(analysis)}
          >
            ✅ Accept Offer (${offeredAmount})
          </button>
          <button 
            style={styles.negotiateButton}
            onClick={() => {
              handleNegotiate();
              onNegotiate(analysis);
            }}
          >
            💼 Negotiate Better Deal
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getRecommendationColor = (recommendation) => {
  switch (recommendation) {
    case 'accept': return '#10b981';
    case 'negotiate': return '#f59e0b';
    case 'decline': return '#ef4444';
    default: return '#64748b';
  }
};

const getRiskColor = (risk) => {
  switch (risk) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#ef4444';
    default: return '#64748b';
  }
};

const getInsightColor = (severity) => {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    case 'low': return '#3b82f6';
    default: return '#64748b';
  }
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem'
  },
  modal: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderRadius: '20px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #475569',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #475569',
    background: 'rgba(139, 92, 246, 0.1)'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#e2e8f0'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem'
  },
  assessmentCard: {
    padding: '1.5rem',
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px',
    marginBottom: '1.5rem'
  },
  assessmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  assessmentBadge: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'white'
  },
  confidenceScore: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  recommendation: {
    fontSize: '1.25rem',
    color: '#e2e8f0',
    marginBottom: '0.5rem'
  },
  riskLevel: {
    fontSize: '1rem',
    color: '#94a3b8'
  },
  section: {
    marginBottom: '2rem'
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '1rem'
  },
  contractText: {
    padding: '1rem',
    background: 'rgba(30, 41, 59, 0.3)',
    border: '1px solid #475569',
    borderRadius: '8px',
    color: '#e2e8f0',
    lineHeight: '1.6',
    fontSize: '0.9rem',
    userSelect: 'text',
    cursor: 'text'
  },
  tooltip: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '2px solid #8b5cf6',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)'
  },
  tooltipHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    color: '#fbbf24'
  },
  tooltipText: {
    color: '#e2e8f0',
    fontSize: '0.9rem',
    marginBottom: '0.75rem'
  },
  tooltipConcerns: {
    padding: '0.75rem',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    color: '#fca5a5'
  },
  tooltipList: {
    margin: '0.5rem 0 0 1rem',
    paddingLeft: '0.5rem'
  },
  insightsGrid: {
    display: 'grid',
    gap: '1rem'
  },
  insightCard: {
    padding: '1rem',
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px'
  },
  insightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  },
  insightType: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#8b5cf6'
  },
  insightSeverity: {
    fontSize: '0.75rem',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  insightTitle: {
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '0.5rem'
  },
  insightMessage: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: '1.5'
  },
  actionItems: {
    marginTop: '0.75rem',
    listStyle: 'none',
    padding: 0
  },
  flagsGrid: {
    display: 'grid',
    gap: '0.75rem'
  },
  redFlag: {
    padding: '1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '8px'
  },
  flagSeverity: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    background: '#ef4444',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    marginBottom: '0.5rem'
  },
  flagText: {
    color: '#e2e8f0',
    marginBottom: '0.5rem'
  },
  flagMitigation: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  greenFlagsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  greenFlag: {
    padding: '0.75rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10b981',
    borderRadius: '8px',
    color: '#6ee7b7',
    marginBottom: '0.5rem'
  },
  learningCard: {
    padding: '1rem',
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px'
  },
  skillGaps: {
    marginBottom: '1rem'
  },
  skillTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  skillTag: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '20px',
    fontSize: '0.875rem',
    color: 'white'
  },
  improvement: {
    color: '#94a3b8',
    fontSize: '0.9rem'
  },
  counterOfferCard: {
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '2px solid #8b5cf6',
    borderRadius: '12px'
  },
  offerAmount: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  offerLabel: {
    color: '#94a3b8'
  },
  offerValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#10b981'
  },
  offerRange: {
    color: '#64748b',
    fontSize: '0.875rem',
    marginBottom: '1rem'
  },
  justification: {
    marginBottom: '1rem',
    color: '#e2e8f0'
  },
  script: {
    padding: '1rem',
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '8px',
    border: '1px solid #8b5cf6'
  },
  scriptText: {
    color: '#c4b5fd',
    fontStyle: 'italic',
    marginTop: '0.5rem'
  },
  footer: {
    display: 'flex',
    gap: '1rem',
    padding: '1.5rem',
    borderTop: '1px solid #475569',
    background: 'rgba(15, 23, 42, 0.5)'
  },
  acceptButton: {
    flex: 1,
    padding: '1rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
  },
  negotiateButton: {
    flex: 1,
    padding: '1rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    color: '#94a3b8'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(139, 92, 246, 0.1)',
    borderTop: '4px solid #8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  }
};

export default NegotiationAssistant;
