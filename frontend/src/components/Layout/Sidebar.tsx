import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import {
  HomeIcon,
  UserGroupIcon,
  NewspaperIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  CogIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  UsersIcon,
  SparklesIcon,
} from '@heroicons/react/outline';
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CogIcon as CogIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  UsersIcon as UsersIconSolid,
  SparklesIcon as SparklesIconSolid,
} from '@heroicons/react/solid';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Feed', href: '/feed', icon: NewspaperIcon, iconSolid: NewspaperIconSolid },
  { name: 'Connections', href: '/connections', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBagIcon, iconSolid: ShoppingBagIconSolid },
  { name: 'DAO', href: '/dao', icon: ShieldCheckIcon, iconSolid: ShieldCheckIconSolid },
  { name: 'Staking', href: '/staking', icon: CurrencyDollarIcon, iconSolid: CurrencyDollarIconSolid },
  { name: 'Settings', href: '/settings', icon: CogIcon, iconSolid: CogIconSolid },
];

const stats = [
  { name: 'Total Users', value: '12,345', change: '+12%', changeType: 'positive' },
  { name: 'Active Posts', value: '8,901', change: '+8%', changeType: 'positive' },
  { name: 'CLP Staked', value: '2.4M', change: '+15%', changeType: 'positive' },
  { name: 'DAO Proposals', value: '23', change: '+3', changeType: 'neutral' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">CLP</span>
        </div>
        <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
          ChainLinkPro
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Stats */}
      {isConnected && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Platform Stats
            </h3>
            <div className="space-y-2">
              {stats.map((stat) => (
                <div key={stat.name} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                    <span
                      className={`text-xs ${
                        stat.changeType === 'positive'
                          ? 'text-green-600 dark:text-green-400'
                          : stat.changeType === 'negative'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isConnected && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <button className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200">
              <SparklesIcon className="mr-2 h-4 w-4" />
              Create Post
            </button>
            <button className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <UsersIcon className="mr-2 h-4 w-4" />
              Find Connections
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;