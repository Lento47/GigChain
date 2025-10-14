import { json } from '@sveltejs/kit';

export async function GET() {
    const mcpData = {
        tools: [
            {
                name: 'GigChainContractGenerator',
                description: 'Generates smart contract JSON for GigChain.io gigs',
                endpoint: '/api/contract/generate'
            },
            {
                name: 'GigChainNegotiation',
                description: 'Negotiates gig terms using AI agents',
                endpoint: '/api/contract/negotiate'
            },
            {
                name: 'GigChainResolver',
                description: 'Resolves disputes for GigChain.io gigs using Chainlink oracles',
                endpoint: '/api/contract/resolve'
            }
        ],
        capabilities: ['contract_generation', 'negotiation', 'escrow_management', 'dispute_resolution']
    };
    return json(mcpData);
}