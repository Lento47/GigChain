import React, { useState, useEffect } from 'react';
import { Shield, Menu, X } from 'lucide-react';
import './home-navbar.css';

const HomeNavbar = ({ onGetStarted, authAction }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`home-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <div className="navbar-brand">
          <Shield className="brand-icon" />
          <span className="brand-name">GigChain.io</span>
        </div>

        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <button onClick={() => scrollToSection('features')} className="nav-link">
            Características
          </button>
          <button onClick={() => scrollToSection('security')} className="nav-link">
            Seguridad
          </button>
          <button onClick={() => scrollToSection('how-it-works')} className="nav-link">
            Cómo Funciona
          </button>
          <a href="https://docs.gigchain.io" target="_blank" rel="noopener" className="nav-link">
            Docs
          </a>
          
          <button 
            onClick={authAction ? authAction.action : onGetStarted} 
            className={`nav-cta ${authAction?.disabled ? 'disabled' : ''}`}
            disabled={authAction?.disabled}
          >
            {authAction ? authAction.text : 'Comenzar'}
          </button>
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default HomeNavbar;
