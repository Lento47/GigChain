import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Wallet,
  Bot,
  BarChart3,
  User,
  Menu,
  X,
  MessageSquare,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import { useSwipeGesture } from '../../../hooks/useResponsive';
import './EnhancedMobileNav.css';

const EnhancedMobileNav = ({ 
  onMenuToggle, 
  isMenuOpen, 
  unreadNotifications = 0,
  onNotificationClick 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  // Main navigation items
  const navItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Home',
      isActive: location.pathname === '/dashboard',
      color: 'var(--primary-color)'
    },
    {
      path: '/contracts',
      icon: FileText,
      label: 'Contracts',
      isActive: location.pathname === '/contracts',
      color: 'var(--accent-color)'
    },
    {
      path: '/chat',
      icon: MessageSquare,
      label: 'Chat',
      isActive: location.pathname === '/chat',
      color: 'var(--success-color)',
      badge: true // Show AI indicator
    },
    {
      path: '/wallets',
      icon: Wallet,
      label: 'Wallets',
      isActive: location.pathname === '/wallets',
      color: 'var(--warning-color)'
    }
  ];

  // Quick action items (shown when menu is expanded)
  const quickActions = [
    {
      path: '/ai',
      icon: Bot,
      label: 'AI Agents',
      color: 'var(--purple-500)'
    },
    {
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      color: 'var(--blue-500)'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      color: 'var(--gray-500)'
    }
  ];

  // Haptic feedback function
  const triggerHapticFeedback = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Light tap
    }
  };

  // Swipe gestures for navigation
  const swipeHandlers = useSwipeGesture(
    () => {
      // Swipe left - next tab
      const currentIndex = navItems.findIndex(item => item.isActive);
      const nextIndex = (currentIndex + 1) % navItems.length;
      navigate(navItems[nextIndex].path);
      triggerHapticFeedback();
    },
    () => {
      // Swipe right - previous tab
      const currentIndex = navItems.findIndex(item => item.isActive);
      const prevIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
      navigate(navItems[prevIndex].path);
      triggerHapticFeedback();
    }
  );

  const handleNavigation = (path) => {
    navigate(path);
    triggerHapticFeedback();
    setShowQuickActions(false);
  };

  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onMenuToggle();
    triggerHapticFeedback();
    setShowQuickActions(!showQuickActions);
  };

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    }
    triggerHapticFeedback();
  };

  // Close quick actions when route changes
  useEffect(() => {
    setShowQuickActions(false);
  }, [location.pathname]);

  return (
    <>
      {/* Quick Actions Overlay */}
      {showQuickActions && (
        <div className="mobile-quick-actions-overlay">
          <div className="mobile-quick-actions">
            <div className="quick-actions-header">
              <h3>Quick Actions</h3>
              <button 
                onClick={() => setShowQuickActions(false)}
                className="quick-actions-close"
                aria-label="Close quick actions"
              >
                <X size={20} />
              </button>
            </div>
            <div className="quick-actions-grid">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={() => handleNavigation(action.path)}
                    className="quick-action-item"
                    style={{ '--action-color': action.color }}
                  >
                    <div className="quick-action-icon">
                      <IconComponent size={24} />
                    </div>
                    <span className="quick-action-label">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Bottom Navigation */}
      <nav 
        className="enhanced-mobile-nav" 
        role="navigation" 
        aria-label="Mobile navigation"
        {...swipeHandlers}
      >
        <div className="mobile-nav-container">
          {/* Main Navigation Items */}
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`mobile-nav-item ${item.isActive ? 'active' : ''}`}
                aria-label={`Navigate to ${item.label}`}
                style={{ '--nav-color': item.color }}
                type="button"
              >
                <div className="mobile-nav-icon">
                  <IconComponent 
                    size={22} 
                    strokeWidth={item.isActive ? 2.5 : 2} 
                  />
                  {item.badge && <div className="nav-badge ai-badge" />}
                </div>
                <span className="mobile-nav-label">{item.label}</span>
                {item.isActive && (
                  <div 
                    className="mobile-nav-indicator" 
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </button>
            );
          })}
          
          {/* Menu/More Button */}
          <button
            onClick={handleMenuToggle}
            className={`mobile-nav-item menu-toggle ${isMenuOpen || showQuickActions ? 'active' : ''}`}
            aria-label={showQuickActions ? 'Close menu' : 'Open menu'}
            aria-expanded={showQuickActions}
            type="button"
          >
            <div className="mobile-nav-icon">
              {showQuickActions ? (
                <X size={22} strokeWidth={2.5} />
              ) : (
                <Menu size={22} strokeWidth={isMenuOpen ? 2.5 : 2} />
              )}
              {unreadNotifications > 0 && (
                <div className="nav-badge notification-badge">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </div>
              )}
            </div>
            <span className="mobile-nav-label">
              {showQuickActions ? 'Close' : 'More'}
            </span>
            {(isMenuOpen || showQuickActions) && (
              <div className="mobile-nav-indicator menu-indicator" />
            )}
          </button>
        </div>

        {/* Navigation Indicator Bar */}
        <div className="nav-indicator-bar">
          <div 
            className="nav-indicator-track"
            style={{
              transform: `translateX(${navItems.findIndex(item => item.isActive) * 25}%)`,
              backgroundColor: navItems.find(item => item.isActive)?.color || 'var(--primary-color)'
            }}
          />
        </div>
      </nav>
    </>
  );
};

export default EnhancedMobileNav;
