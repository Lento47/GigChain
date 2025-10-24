import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useActiveAccount } from 'thirdweb/react';
import PostCreationForm from '../PostCreation/PostCreationForm';
import SmartNotifications from '../Notifications/SmartNotifications';
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
  BellIcon,
  PlusIcon,
  FireIcon,
  TrophyIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
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
  BellIcon as BellIconSolid,
  FireIcon as FireIconSolid,
  TrophyIcon as TrophyIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  HeartIcon as HeartIconSolid,
  ShareIcon as ShareIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  FolderIcon as FolderIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

const getNavigationForSection = (currentPath: string) => {
  const baseNavigation = [
    { 
      name: 'Home', 
      href: '/', 
      icon: HomeIcon, 
      iconSolid: HomeIconSolid,
      badge: null,
      description: 'Discover and explore'
    }
  ];

  // Navigation específica para cada sección
  if (currentPath.startsWith('/feed')) {
    return [
      ...baseNavigation,
      { 
        name: 'Feed', 
        href: '/feed', 
        icon: NewspaperIcon, 
        iconSolid: NewspaperIconSolid,
        badge: '12',
        description: 'Latest posts and updates'
      },
      { 
        name: 'Trending', 
        href: '/feed?filter=trending', 
        icon: FireIcon, 
        iconSolid: FireIconSolid,
        badge: null,
        description: 'Most popular content'
      },
      { 
        name: 'Jobs', 
        href: '/feed?filter=jobs', 
        icon: CurrencyDollarIcon, 
        iconSolid: CurrencyDollarIconSolid,
        badge: '8',
        description: 'Job opportunities'
      },
      { 
        name: 'Achievements', 
        href: '/feed?filter=achievements', 
        icon: TrophyIcon, 
        iconSolid: TrophyIconSolid,
        badge: null,
        description: 'Community achievements'
      },
      { 
        name: 'Skills', 
        href: '/feed?filter=skills', 
        icon: SparklesIcon, 
        iconSolid: SparklesIconSolid,
        badge: null,
        description: 'Skill showcases'
      }
    ];
  }

  if (currentPath.startsWith('/marketplace')) {
    return [
      ...baseNavigation,
      { 
        name: 'Marketplace', 
        href: '/marketplace', 
        icon: ShoppingBagIcon, 
        iconSolid: ShoppingBagIconSolid,
        badge: null,
        description: 'Services and skills'
      },
      { 
        name: 'Services', 
        href: '/marketplace/services', 
        icon: CogIcon, 
        iconSolid: CogIconSolid,
        badge: null,
        description: 'Browse services'
      },
      { 
        name: 'Skills', 
        href: '/marketplace/skills', 
        icon: SparklesIcon, 
        iconSolid: SparklesIconSolid,
        badge: null,
        description: 'Find talent'
      },
      { 
        name: 'My Listings', 
        href: '/marketplace/my-listings', 
        icon: UserIcon, 
        iconSolid: UserIconSolid,
        badge: null,
        description: 'Your offerings'
      }
    ];
  }

  if (currentPath.startsWith('/contracts')) {
    return [
      ...baseNavigation,
      { 
        name: 'Contracts', 
        href: '/contracts', 
        icon: DocumentTextIcon, 
        iconSolid: DocumentTextIconSolid,
        badge: null,
        description: 'Smart contracts'
      },
      { 
        name: 'Templates', 
        href: '/contracts/templates', 
        icon: ClipboardDocumentListIcon, 
        iconSolid: ClipboardDocumentListIconSolid,
        badge: null,
        description: 'Contract templates'
      },
      { 
        name: 'My Contracts', 
        href: '/contracts/my-contracts', 
        icon: FolderIcon, 
        iconSolid: FolderIconSolid,
        badge: null,
        description: 'Your contracts'
      },
      { 
        name: 'Negotiations', 
        href: '/contracts/negotiations', 
        icon: ChatBubbleLeftRightIcon, 
        iconSolid: ChatBubbleLeftRightIconSolid,
        badge: '3',
        description: 'Active negotiations'
      }
    ];
  }

  // Navigation por defecto
  return [
    ...baseNavigation,
    { 
      name: 'Feed', 
      href: '/feed', 
      icon: NewspaperIcon, 
      iconSolid: NewspaperIconSolid,
      badge: '12',
      description: 'Latest posts and updates'
    },
    { 
      name: 'Connections', 
      href: '/connections', 
      icon: UserGroupIcon, 
      iconSolid: UserGroupIconSolid,
      badge: '5',
      description: 'Your professional network'
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: ChatBubbleLeftRightIcon, 
      iconSolid: ChatBubbleLeftRightIconSolid,
      badge: '3',
      description: 'Direct messages'
    },
    { 
      name: 'Marketplace', 
      href: '/marketplace', 
      icon: ShoppingBagIcon, 
      iconSolid: ShoppingBagIconSolid,
      badge: null,
      description: 'Services and skills'
    },
    { 
      name: 'DAO', 
      href: '/dao', 
      icon: ShieldCheckIcon, 
      iconSolid: ShieldCheckIconSolid,
      badge: '2',
      description: 'Community governance'
    },
    { 
      name: 'Staking', 
      href: '/staking', 
      icon: CurrencyDollarIcon, 
      iconSolid: CurrencyDollarIconSolid,
      badge: null,
      description: 'Earn rewards'
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: ChartBarIcon, 
      iconSolid: ChartBarIconSolid,
      badge: null,
      description: 'Your performance'
    },
  ];
};

const quickActions = [
  { name: 'Create Post', icon: PlusIcon, color: 'from-blue-500 to-purple-600' },
  { name: 'Find People', icon: MagnifyingGlassIcon, color: 'from-green-500 to-teal-600' },
  { name: 'Start Chat', icon: ChatBubbleLeftRightIcon, color: 'from-pink-500 to-rose-600' },
  { name: 'Explore DAO', icon: GlobeAltIcon, color: 'from-orange-500 to-red-600' },
];

const trendingTopics = [
  { name: 'Web3 Jobs', posts: '2.3k', trend: '+15%' },
  { name: 'DeFi', posts: '1.8k', trend: '+8%' },
  { name: 'NFT Art', posts: '1.2k', trend: '+22%' },
  { name: 'Blockchain', posts: '3.1k', trend: '+5%' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  const address = activeAccount?.address;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPostCreation, setShowPostCreation] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  
  // Obtener navegación contextual basada en la ruta actual
  const navigation = getNavigationForSection(location.pathname);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-72'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">GCH</span>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                GigChain
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Professional Network
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          {isCollapsed ? (
            <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* User Profile */}
      {isConnected && !isCollapsed && (
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {address?.slice(2, 4).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Professional Level
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 relative"
              >
                <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">3</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search GigChain..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center w-full">
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
              {!isCollapsed && isActive && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.name === 'Create Post') {
                    setShowPostCreation(true);
                  }
                }}
                className={`flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r ${action.color} rounded-lg hover:shadow-lg transition-all duration-200`}
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Topics */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Trending Now
          </h3>
          <div className="space-y-2">
            {trendingTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    #{topic.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {topic.posts} posts
                  </p>
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {topic.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Stats */}
      {isConnected && !isCollapsed && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">1.2k</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Connections</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">89</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">2.4k</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">GCH Earned</p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Notifications */}
      <SmartNotifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        userId={address || 'current_user'}
      />

      {/* Post Creation Form */}
      <PostCreationForm
        isOpen={showPostCreation}
        onClose={() => setShowPostCreation(false)}
        onSubmit={(postData) => {
          console.log('New post:', postData);
          // Aquí se enviaría el post al backend
        }}
        userName={address?.slice(0, 6) || 'Usuario'}
      />
    </div>
  );
};

export default Sidebar;