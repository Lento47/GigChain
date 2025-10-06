import React from 'react';
import { Github, Twitter, MessageCircle, Mail, Shield, FileText, Lock, AlertTriangle, Code } from 'lucide-react';
import { CookieSettingsButton } from './CookieConsent';
import '../styles/components/footer.css';

const Footer = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (view) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <footer className="gigchain-footer">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-section">
            <h3 className="footer-brand">
              <Shield size={24} />
              GigChain.io
            </h3>
            <p className="footer-tagline">
              Plataforma descentralizada de trabajo freelance con contratos inteligentes y IA.
            </p>
            <div className="footer-social">
              <a href="https://github.com/gigchain" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="https://twitter.com/gigchain" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://discord.gg/gigchain" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                <MessageCircle size={20} />
              </a>
              <a href="mailto:contact@gigchain.io" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="footer-section">
            <h4 className="footer-title">Producto</h4>
            <ul className="footer-links">
              <li><a href="#features">Características</a></li>
              <li><a href="#pricing">Precios</a></li>
              <li><a href="#security">Seguridad</a></li>
              <li><a href="#roadmap">Roadmap</a></li>
              <li><a href="https://docs.gigchain.io" target="_blank" rel="noopener">Documentación</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4 className="footer-title">Recursos</h4>
            <ul className="footer-links">
              <li><a href="https://blog.gigchain.io" target="_blank" rel="noopener">Blog</a></li>
              <li><a href="https://docs.gigchain.io/guides" target="_blank" rel="noopener">Guías</a></li>
              <li><a href="https://docs.gigchain.io/api" target="_blank" rel="noopener">API</a></li>
              <li><a href="https://github.com/gigchain/platform" target="_blank" rel="noopener">Código Abierto</a></li>
              <li><a href="https://status.gigchain.io" target="_blank" rel="noopener">Estado del Sistema</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="footer-section">
            <h4 className="footer-title">Legal y Compliance</h4>
            <ul className="footer-links">
              <li>
                <button onClick={() => handleLinkClick('terms')} className="footer-link-btn">
                  <FileText size={16} />
                  Términos y Condiciones
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('privacy')} className="footer-link-btn">
                  <Lock size={16} />
                  Política de Privacidad
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('prohibited')} className="footer-link-btn">
                  <AlertTriangle size={16} />
                  Actividades Prohibidas
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('license')} className="footer-link-btn">
                  <Code size={16} />
                  Licencia Open Source
                </button>
              </li>
              <li>
                <CookieSettingsButton />
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} GigChain.io. Todos los derechos reservados.
            </p>
            <div className="footer-badges">
              <span className="footer-badge">
                <Shield size={14} />
                Contratos Auditados
              </span>
              <span className="footer-badge">
                <Lock size={14} />
                GDPR Compliant
              </span>
              <span className="footer-badge">
                <Code size={14} />
                MIT License
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
