import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  BellIcon, 
  MenuIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  FireIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  showMenu: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenu }) => {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, type: 'connection', message: 'John Doe wants to connect with you', time: '2m ago', unread: true },
    { id: 2, type: 'like', message: 'Sarah liked your post about Web3', time: '5m ago', unread: true },
    { id: 3, type: 'comment', message: 'Mike commented on your DAO proposal', time: '1h ago', unread: true },
    { id: 4, type: 'dao', message: 'New DAO proposal is available for voting', time: '2h ago', unread: false },
    { id: 5, type: 'staking', message: 'Your staking rewards are ready to claim', time: '3h ago', unread: false },
  ];

  const quickActions = [
    { name: 'Create Post', icon: PlusIcon, href: '/create-post', color: 'text-blue-600' },
    { name: 'Start Chat', icon: ChatBubbleLeftRightIcon, href: '/messages', color: 'text-green-600' },
    { name: 'Explore DAO', icon: GlobeAltIcon, href: '/dao', color: 'text-purple-600' },
    { name: 'View Analytics', icon: TrophyIcon, href: '/analytics', color: 'text-orange-600' },
  ];

  const userMenuItems = [
    { name: 'Profile', icon: UserCircleIcon, href: '/profile' },
    { name: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
    { name: 'Sign Out', icon: ArrowRightOnRectangleIcon, href: '/logout', danger: true },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {showMenu && (
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={onMenuClick}
              >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" />
              </button>
            )}
            
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                <span className="text-white font-bold text-lg">GCH</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  GigChain
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Professional Network
                </p>
              </div>
            </button>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search professionals, skills, content, DAO proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <span className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">×</span>
                </button>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            {isConnected && (
              <div className="hidden lg:flex items-center space-x-1">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.href)}
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${action.color}`}
                    title={action.name}
                  >
                    <action.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            )}

            {/* Notifications */}
            {isConnected && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative transition-colors duration-200"
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                          Mark all read
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer ${
                            notification.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <BellIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wallet connection */}
            <ConnectButton
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
              chainStatus="icon"
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />

            {/* User menu */}
            {isConnected && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {address?.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Profile
                  </span>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      {userMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            navigate(item.href);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center px-4 py-2 text-sm transition-colors duration-200 ${
                            item.danger
                              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <item.icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      {isConnected && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="px-4 py-2">
            <div className="flex space-x-1">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.href)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${action.color} bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600`}
                >
                  <action.icon className="h-4 w-4 mr-1" />
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;