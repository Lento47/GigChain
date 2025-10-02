describe('GigChain Contract Generation', () => {
  beforeEach(() => {
    // Mock API responses
    cy.intercept('POST', '/api/full_flow', {
      statusCode: 200,
      body: {
        contract_id: 'gig_2025-10-01T19:35:29.707295',
        json: {
          counter_offer: 4500.0,
          milestones: [
            {
              desc: 'Design draft',
              amount: 2000.0,
              deadline: '2025-10-10'
            },
            {
              desc: 'Final delivery',
              amount: 2500.0,
              deadline: '2025-10-20'
            }
          ],
          full_terms: 'Este contrato establece los términos para el desarrollo de un proyecto con un costo total de 4500.0 USDC.',
          escrow_params: {
            token: 'USDC',
            milestones: [
              {
                amount: 2000.0,
                deadline: '2025-10-10',
                description: 'Design draft'
              },
              {
                amount: 2500.0,
                deadline: '2025-10-20',
                description: 'Final delivery'
              }
            ]
          },
          clauses: [
            'Fondos bloqueados en escrow inteligente en Polygon usando USDC',
            'Cesión de derechos de IP al cliente tras el pago final',
            'Penalización por retraso: 5% del hito pendiente por cada día de demora'
          ],
          disclaimer: 'Este es un borrador AI generado por GigChain.io. No constituye consejo legal.'
        },
        escrow_ready: true,
        api_metadata: {
          timestamp: '2025-10-01T19:35:29.707295',
          endpoint: 'full_flow',
          ai_agents_used: true,
          processing_time: 'calculated_by_client'
        }
      }
    }).as('generateContract');

    cy.intercept('GET', '/health', {
      statusCode: 200,
      body: {
        status: 'healthy',
        timestamp: '2025-10-01T19:35:29.707295',
        service: 'GigChain API',
        version: '1.0.0',
        ai_agents_active: true
      }
    }).as('healthCheck');
  });

  it('should load the main page', () => {
    cy.visit('/');
    cy.contains('GigChain.io').should('be.visible');
    cy.contains('AI-Powered Web3 Contract Generation').should('be.visible');
  });

  it('should have wallet connect button', () => {
    cy.visit('/');
    cy.get('[data-wc-wallet-button]').should('be.visible');
  });

  it('should generate contract on form submission', () => {
    cy.visit('/');
    
    // Fill in contract description
    cy.get('textarea').type('Freelancer ofrezco 2000 dolares para desarrollo web. Cliente solicita 5000 dolares. Proyecto complejo de 20 días.');
    
    // Submit form
    cy.get('button').contains('Generate Smart Contract').click();
    
    // Wait for API call
    cy.wait('@generateContract');
    
    // Verify contract display
    cy.contains('Generated Contract').should('be.visible');
    cy.contains('Contract ID: gig_2025-10-01T19:35:29.707295').should('be.visible');
    cy.contains('AI-Generated Terms').should('be.visible');
    cy.contains('Escrow Parameters').should('be.visible');
    cy.contains('Legal Clauses').should('be.visible');
  });

  it('should display AI agent output', () => {
    cy.visit('/');
    
    cy.get('textarea').type('Complex negotiation test');
    cy.get('button').contains('Generate Smart Contract').click();
    cy.wait('@generateContract');
    
    // Check AI-specific content
    cy.contains('🤖 AI-Generated Terms').should('be.visible');
    cy.contains('Este contrato establece los términos').should('be.visible');
    cy.contains('4500.0 USDC').should('be.visible');
    cy.contains('Deploy Escrow Contract').should('be.visible');
  });

  it('should show escrow deployment button when ready', () => {
    cy.visit('/');
    
    cy.get('textarea').type('Test contract for deployment');
    cy.get('button').contains('Generate Smart Contract').click();
    cy.wait('@generateContract');
    
    cy.get('.deploy-button').should('be.visible');
    cy.get('.deploy-button').contains('Deploy Escrow Contract');
  });

  it('should display disclaimer', () => {
    cy.visit('/');
    
    cy.get('textarea').type('Test contract');
    cy.get('button').contains('Generate Smart Contract').click();
    cy.wait('@generateContract');
    
    cy.contains('Este es un borrador AI generado por GigChain.io').should('be.visible');
    cy.contains('No constituye consejo legal').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('POST', '/api/full_flow', {
      statusCode: 500,
      body: {
        detail: 'Internal server error'
      }
    }).as('apiError');

    cy.visit('/');
    
    cy.get('textarea').type('Test contract that will fail');
    cy.get('button').contains('Generate Smart Contract').click();
    cy.wait('@apiError');
    
    cy.contains('Error generating contract').should('be.visible');
  });

  it('should show loading state during generation', () => {
    cy.visit('/');
    
    cy.get('textarea').type('Test contract');
    cy.get('button').contains('Generate Smart Contract').click();
    
    // Check loading state
    cy.get('button').contains('Generating AI Contract...').should('be.visible');
    cy.get('.spinning').should('be.visible');
    
    cy.wait('@generateContract');
    cy.get('button').contains('Generate Smart Contract').should('be.visible');
  });

  it('should be responsive on mobile', () => {
    cy.viewport(375, 667); // iPhone SE
    cy.visit('/');
    
    cy.contains('GigChain.io').should('be.visible');
    cy.get('textarea').should('be.visible');
    cy.get('button').should('be.visible');
  });
});
