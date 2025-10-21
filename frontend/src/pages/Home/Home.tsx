import React from 'react';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon, 
  CheckCircleIcon, 
  SparklesIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from '@heroicons/react/outline';

const Home: React.FC = () => {
  const { isConnected } = useAccount();

  const features = [
    {
      name: 'Professional Profiles as NFTs',
      description: 'Your professional identity as a soulbound NFT that you own and control.',
      icon: UserGroupIcon,
    },
    {
      name: 'Decentralized Networking',
      description: 'Connect with professionals on-chain, build your network without intermediaries.',
      icon: GlobeAltIcon,
    },
    {
      name: 'Token Rewards',
      description: 'Earn CLP tokens for engagement, content creation, and valuable contributions.',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'DAO Governance',
      description: 'Participate in platform decisions through decentralized voting and proposals.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Skill Verification',
      description: 'Get your skills verified by the community and build on-chain reputation.',
      icon: CheckCircleIcon,
    },
    {
      name: 'Analytics & Insights',
      description: 'Track your professional growth and network impact with detailed analytics.',
      icon: ChartBarIcon,
    },
  ];

  const stats = [
    { name: 'Active Professionals', value: '12,345', change: '+12%' },
    { name: 'Total Connections', value: '45,678', change: '+8%' },
    { name: 'CLP Tokens Earned', value: '2.4M', change: '+15%' },
    { name: 'DAO Proposals', value: '23', change: '+3' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">The Future of</span>{' '}
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500 xl:inline">
                    Professional Networking
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  ChainLinkPro is a decentralized social network where professionals own their data, 
                  earn tokens for engagement, and participate in community governance. 
                  Build your reputation, connect with peers, and shape the future of work.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    {isConnected ? (
                      <Link
                        to="/feed"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                      >
                        Go to Feed
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </Link>
                    ) : (
                      <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 md:py-4 md:text-lg md:px-10 transition-all duration-200">
                        Connect Wallet
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/marketplace"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                    >
                      Explore Marketplace
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.name}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Why ChainLinkPro?
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Experience the next generation of professional networking with blockchain technology.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="relative p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <feature.icon className="h-8 w-8 text-primary-500" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {feature.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to join the future?</span>
            <span className="block text-primary-100">
              Start building your professional reputation on-chain.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/feed"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors duration-200"
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/dao"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;