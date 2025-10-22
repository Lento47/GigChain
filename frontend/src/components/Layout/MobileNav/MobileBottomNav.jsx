import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Wallet,
  Bot,
  BarChart3,
  User,
  Menu
} from 'lucide-react';
import './MobileBottomNav.css';

const MobileBottomNav = ({ onMenuToggle, isMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Home',
      isActive: location.pathname === '/dashboard'
    },
    {
      path: '/contracts',
      icon: FileText,
      label: 'Contracts',
      isActive: location.pathname === '/contracts'
    },
    {
      path: '/wallets',
      icon: Wallet,
      label: 'Wallets',
      isActive: location.pathname === '/wallets'
    },
    {
      path: '/ai-agents',
      icon: Bot,
      label: 'AI',
      isActive: location.pathname === '/ai-agents'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onMenuToggle();
  };

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      <div className="mobile-nav-container">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`mobile-nav-item ${item.isActive ? 'active' : ''}`}
              aria-label={`Navigate to ${item.label}`}
              type="button"
            >
              <div className="mobile-nav-icon">
                <IconComponent size={22} strokeWidth={item.isActive ? 2.5 : 2} />
              </div>
              <span className="mobile-nav-label">{item.label}</span>
              {item.isActive && <div className="mobile-nav-indicator" />}
            </button>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={handleMenuToggle}
          className={`mobile-nav-item menu-toggle ${isMenuOpen ? 'active' : ''}`}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          type="button"
        >
          <div className="mobile-nav-icon">
            <Menu size={22} strokeWidth={isMenuOpen ? 2.5 : 2} />
          </div>
          <span className="mobile-nav-label">Menu</span>
          {isMenuOpen && <div className="mobile-nav-indicator menu-indicator" />}
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
