import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, polygon, polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { Toaster } from 'react-hot-toast';

// Import components
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import Feed from './pages/Feed/Feed';
import Connections from './pages/Connections/Connections';
import Marketplace from './pages/Marketplace/Marketplace';
import DAO from './pages/DAO/DAO';
import Staking from './pages/Staking/Staking';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound/NotFound';

// Import styles
import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

// Configure chains
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygonMumbai, polygon, mainnet],
  [publicProvider()]
);

// Configure wallets
const { connectors } = getDefaultWallets({
  appName: 'ChainLinkPro',
  projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || '',
  chains,
});

// Create wagmi config
const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider chains={chains} modalSize="compact">
          <Router>
            <div className="App">
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/profile/:address" element={<Profile />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/connections" element={<Connections />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/dao" element={<DAO />} />
                  <Route path="/staking" element={<Staking />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#f9fafb',
                    border: '1px solid #374151',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#f9fafb',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#f9fafb',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;