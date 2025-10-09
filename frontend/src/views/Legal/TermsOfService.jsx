import React from 'react';
import { FileText, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import './Legal.css';

const TermsOfService = ({ onClose }) => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <FileText className="legal-icon" />
        <h1>Términos y Condiciones de Servicio</h1>
        <p className="legal-subtitle">Última actualización: 6 de Octubre, 2025</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar GigChain.io ("la Plataforma"), usted acepta estar sujeto a estos 
            Términos y Condiciones ("Términos"). Si no está de acuerdo con estos términos, no utilice 
            la Plataforma.
          </p>
          <div className="legal-highlight">
            <Shield size={20} />
            <p>
              <strong>Importante:</strong> GigChain es una plataforma descentralizada. Usted es 
              responsable de la seguridad de su wallet y claves privadas.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. Descripción del Servicio</h2>
          <p>GigChain.io es una plataforma descentralizada que facilita:</p>
          <ul className="legal-list">
            <li>Contratos inteligentes (smart contracts) para acuerdos de trabajo freelance</li>
            <li>Servicios de depósito en garantía (escrow) automatizados en blockchain</li>
            <li>Asistencia de IA para negociación y gestión de contratos</li>
            <li>Sistema de reputación on-chain inmutable</li>
            <li>Pagos peer-to-peer sin intermediarios centralizados</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Elegibilidad y Registro</h2>
          <div className="legal-subsection">
            <h3>3.1 Requisitos de Edad</h3>
            <p>
              Debe tener al menos 18 años o la mayoría de edad legal en su jurisdicción para usar 
              la Plataforma.
            </p>
          </div>
          <div className="legal-subsection">
            <h3>3.2 Conexión de Wallet</h3>
            <p>
              Para usar la Plataforma, debe conectar una wallet Web3 compatible (MetaMask, 
              WalletConnect, etc.). Usted es el único responsable de:
            </p>
            <ul className="legal-list">
              <li>Mantener la seguridad de sus claves privadas</li>
              <li>Todas las transacciones realizadas desde su wallet</li>
              <li>Fondos perdidos por pérdida de claves privadas</li>
            </ul>
          </div>
          <div className="legal-subsection">
            <h3>3.3 Verificación de Identidad (KYC)</h3>
            <p>
              GigChain utiliza verificación de identidad descentralizada (Zero-Knowledge Proofs). 
              Puede ser requerido verificar su identidad para acceder a ciertas funciones, sin 
              revelar información personal sensible.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>4. Uso de Smart Contracts</h2>
          <div className="legal-warning">
            <AlertCircle size={20} />
            <div>
              <h4>Riesgos de Smart Contracts</h4>
              <p>
                Los smart contracts son inmutables una vez desplegados. Aunque nuestros contratos 
                han sido auditados, no podemos garantizar que estén libres de errores. Usted acepta 
                usar los smart contracts bajo su propio riesgo.
              </p>
            </div>
          </div>
          <p>Al crear o aceptar un contrato inteligente, usted acepta que:</p>
          <ul className="legal-list">
            <li>Ha leído y entendido todos los términos del contrato</li>
            <li>Las condiciones son técnicamente ejecutables por código</li>
            <li>Los fondos depositados en escrow solo serán liberados según las condiciones programadas</li>
            <li>Las disputas se resolverán mediante el proceso de arbitraje descrito en el contrato</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Tarifas y Pagos</h2>
          <div className="legal-subsection">
            <h3>5.1 Comisiones de la Plataforma</h3>
            <p>
              GigChain no cobra comisiones por transacciones peer-to-peer. Usted solo paga:
            </p>
            <ul className="legal-list">
              <li><strong>Gas fees de blockchain:</strong> Tarifas de red de Polygon/Ethereum</li>
              <li><strong>Servicios opcionales:</strong> Verificación avanzada, arbitraje premium</li>
            </ul>
          </div>
          <div className="legal-subsection">
            <h3>5.2 Reembolsos</h3>
            <p>
              Debido a la naturaleza inmutable de blockchain, las transacciones no pueden ser 
              revertidas una vez confirmadas. Solo se pueden liberar fondos según las condiciones 
              del smart contract.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>6. Conducta Prohibida</h2>
          <p>Está estrictamente prohibido:</p>
          <ul className="legal-list prohibited">
            <li>Usar la Plataforma para actividades ilegales (ver sección 7)</li>
            <li>Crear contratos fraudulentos o engañosos</li>
            <li>Manipular el sistema de reputación</li>
            <li>Intentar hackear o explotar vulnerabilidades de smart contracts</li>
            <li>Usar bots para spam o manipulación de precios</li>
            <li>Compartir información falsa o difamatoria sobre otros usuarios</li>
            <li>Realizar lavado de dinero o financiación del terrorismo</li>
            <li>Violar derechos de propiedad intelectual de terceros</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Cumplimiento Legal y Sanciones</h2>
          <p>
            GigChain cumple con regulaciones internacionales de AML/CFT. Nos reservamos el derecho 
            de bloquear wallets asociadas con:
          </p>
          <ul className="legal-list">
            <li>Actividades ilegales verificadas</li>
            <li>Listas de sanciones internacionales (OFAC, ONU)</li>
            <li>Jurisdicciones prohibidas según leyes aplicables</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. Resolución de Disputas</h2>
          <div className="legal-subsection">
            <h3>8.1 Arbitraje en Blockchain</h3>
            <p>
              Las disputas sobre contratos se resuelven mediante:
            </p>
            <ol className="legal-list">
              <li>Mediación automática por IA (gratuita)</li>
              <li>Arbitraje por árbitros descentralizados (fee aplicable)</li>
              <li>Votación comunitaria para casos complejos</li>
            </ol>
          </div>
          <div className="legal-subsection">
            <h3>8.2 Jurisdicción</h3>
            <p>
              Estos Términos se rigen por las leyes de [JURISDICCIÓN]. Para disputas fuera de 
              contratos específicos, se aplicará arbitraje vinculante.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>9. Limitación de Responsabilidad</h2>
          <div className="legal-warning">
            <AlertCircle size={20} />
            <div>
              <h4>Descargo de Responsabilidad</h4>
              <p>
                GigChain proporciona la Plataforma "tal cual" sin garantías de ningún tipo. 
                No somos responsables de:
              </p>
              <ul>
                <li>Pérdidas de fondos por errores de smart contracts</li>
                <li>Pérdida de claves privadas por negligencia del usuario</li>
                <li>Cambios en regulaciones que afecten el uso de la Plataforma</li>
                <li>Volatilidad de precios de criptomonedas</li>
                <li>Fallos de redes blockchain (Polygon, Ethereum)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>10. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios 
            serán notificados con 30 días de anticipación. El uso continuado de la Plataforma después 
            de los cambios constituye aceptación de los nuevos términos.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Terminación</h2>
          <p>
            Puede dejar de usar la Plataforma en cualquier momento desconectando su wallet. 
            Nos reservamos el derecho de bloquear el acceso a usuarios que violen estos Términos, 
            sin afectar fondos en contratos activos.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Contacto</h2>
          <p>Para preguntas sobre estos Términos, contacte a:</p>
          <div className="legal-contact">
            <p><strong>Email:</strong> legal@gigchain.io</p>
            <p><strong>Telegram:</strong> @GigChainSupport</p>
            <p><strong>Discord:</strong> discord.gg/gigchain</p>
          </div>
        </section>

        <div className="legal-acceptance">
          <CheckCircle size={24} />
          <p>
            Al hacer clic en "Aceptar" o usar la Plataforma, usted confirma que ha leído, 
            entendido y acepta estos Términos y Condiciones.
          </p>
        </div>
      </div>

      {onClose && (
        <div className="legal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Volver
          </button>
          <button className="btn-primary" onClick={onClose}>
            Aceptar Términos
          </button>
        </div>
      )}
    </div>
  );
};

export default TermsOfService;
