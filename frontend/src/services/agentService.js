import apiClient from './api';

/**
 * AI Agents Service
 * Handles all AI agent-related API calls
 */
export const agentService = {
  /**
   * Get status of all agents
   */
  getStatus: async () => {
    const response = await apiClient.get('/api/agents/status');
    return response.data;
  },

  /**
   * Toggle agent status (enable/disable)
   */
  toggleAgent: async (agentId, enabled) => {
    const response = await apiClient.post(
      `/api/agents/${agentId}/toggle`,
      null,
      { params: { enabled } }
    );
    return response.data;
  },

  /**
   * Configure agent settings
   */
  configureAgent: async (agentId, config) => {
    const response = await apiClient.post(
      `/api/agents/${agentId}/configure`,
      config
    );
    return response.data;
  },

  /**
   * Test an agent with input
   */
  testAgent: async (agentId, input) => {
    const response = await apiClient.post(
      `/api/agents/${agentId}/test`,
      { text: input }
    );
    return response.data;
  },
};

export default agentService;
