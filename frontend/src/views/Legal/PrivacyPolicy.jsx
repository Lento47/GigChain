import React from 'react';
import { Lock, Eye, Database, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import './Legal.css';

const PrivacyPolicy = ({ onClose }) => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <Lock className="legal-icon" />
        <h1>Política de Privacidad y Protección de Datos</h1>
        <p className="legal-subtitle">Última actualización: 6 de Octubre, 2025</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Introducción</h2>
          <p>
            En GigChain.io, nos comprometemos a proteger su privacidad. Esta Política de Privacidad 
            explica qué datos recopilamos, cómo los usamos y sus derechos bajo GDPR, CCPA y otras 
            regulaciones de privacidad.
          </p>
          <div className="legal-highlight">
            <Shield size={20} />
            <p>
              <strong>Principio clave:</strong> Minimizamos la recopilación de datos. Como plataforma 
              descentralizada, la mayoría de sus datos permanecen en blockchain públicos o bajo su control.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. Datos que Recopilamos</h2>
          
          <div className="legal-subsection">
            <h3>2.1 Datos On-Chain (Públicos)</h3>
            <p>Estos datos están permanentemente en blockchain público:</p>
            <ul className="legal-list">
              <li><strong>Dirección de wallet:</strong> Su dirección pública Ethereum/Polygon</li>
              <li><strong>Transacciones:</strong> Historial de contratos y pagos</li>
              <li><strong>Reputación:</strong> Calificaciones y reviews (pseudónimas)</li>
              <li><strong>Smart contracts:</strong> Términos de contratos creados/aceptados</li>
            </ul>
            <div className="legal-note">
              <Database size={18} />
              <p>
                <strong>Nota:</strong> Estos datos son inmutables y no pueden ser eliminados una vez 
                registrados en blockchain.
              </p>
            </div>
          </div>

          <div className="legal-subsection">
            <h3>2.2 Datos Off-Chain (Nuestros Servidores)</h3>
            <p>Recopilamos mínimamente:</p>
            <ul className="legal-list">
              <li><strong>Email (opcional):</strong> Solo si activa notificaciones</li>
              <li><strong>Sesión:</strong> Tokens temporales de autenticación de wallet</li>
              <li><strong>Preferencias UI:</strong> Tema, idioma, configuraciones</li>
              <li><strong>Logs de errores:</strong> Para mejorar la plataforma (anonimizados)</li>
            </ul>
            <p className="data-retention">
              <strong>Retención:</strong> Logs se eliminan después de 90 días. Preferencias se 
              mantienen mientras use la plataforma.
            </p>
          </div>

          <div className="legal-subsection">
            <h3>2.3 Datos que NO Recopilamos</h3>
            <div className="legal-success">
              <CheckCircle size={20} />
              <div>
                <p><strong>Nunca pedimos ni almacenamos:</strong></p>
                <ul>
                  <li>Claves privadas de wallets</li>
                  <li>Información de tarjetas de crédito</li>
                  <li>Números de identificación gubernamental (SSN, DNI)</li>
                  <li>Historial de navegación fuera de GigChain</li>
                  <li>Datos biométricos</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="legal-subsection">
            <h3>2.4 Cookies y Tecnologías de Rastreo</h3>
            <p>Usamos cookies limitadas:</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Propósito</th>
                  <th>Duración</th>
                  <th>Esencial</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sesión</td>
                  <td>Mantener login de wallet</td>
                  <td>24 horas</td>
                  <td>Sí</td>
                </tr>
                <tr>
                  <td>Preferencias</td>
                  <td>Guardar configuración</td>
                  <td>1 año</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>Analytics</td>
                  <td>Estadísticas anónimas</td>
                  <td>90 días</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
            <p className="cookie-note">
              Puede rechazar cookies no esenciales mediante nuestro banner de consentimiento.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>3. Cómo Usamos Sus Datos</h2>
          <p>Utilizamos datos recopilados únicamente para:</p>
          <ol className="legal-list">
            <li>
              <strong>Proveer el servicio:</strong> Facilitar contratos, escrow y pagos
            </li>
            <li>
              <strong>Seguridad:</strong> Prevenir fraude, lavado de dinero y hacking
            </li>
            <li>
              <strong>Cumplimiento legal:</strong> Responder a órdenes judiciales válidas
            </li>
            <li>
              <strong>Mejorar la plataforma:</strong> Analytics agregados y anónimos
            </li>
            <li>
              <strong>Comunicación:</strong> Notificaciones de contratos (si activadas)
            </li>
          </ol>
          <div className="legal-warning">
            <AlertCircle size={20} />
            <div>
              <h4>Nunca vendemos sus datos</h4>
              <p>
                GigChain no vende, alquila ni comparte sus datos personales con terceros para 
                marketing. Somos una plataforma de código abierto sin modelo de negocio basado 
                en datos.
              </p>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>4. Compartir Datos con Terceros</h2>
          <div className="legal-subsection">
            <h3>4.1 Proveedores de Servicios</h3>
            <p>Compartimos datos mínimos con:</p>
            <ul className="legal-list">
              <li>
                <strong>Thirdweb:</strong> SDK para interacción con wallets (no recibe datos personales)
              </li>
              <li>
                <strong>OpenAI:</strong> Procesamiento de mensajes de chat AI (anonimizado)
              </li>
              <li>
                <strong>Infraestructura blockchain:</strong> Nodos RPC de Polygon/Ethereum (datos públicos)
              </li>
              <li>
                <strong>Hosting:</strong> Servidores encriptados (sin acceso a datos sin encriptar)
              </li>
            </ul>
          </div>
          
          <div className="legal-subsection">
            <h3>4.2 Obligaciones Legales</h3>
            <p>
              Podemos divulgar datos si es requerido por ley (orden judicial, subpoena). En tal caso, 
              notificaremos al usuario salvo que esté legalmente prohibido.
            </p>
          </div>

          <div className="legal-subsection">
            <h3>4.3 Transferencias Internacionales</h3>
            <p>
              Datos pueden ser procesados en servidores fuera de la UE/EEA. Usamos mecanismos de 
              transferencia aprobados por GDPR (cláusulas contractuales estándar).
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>5. Sus Derechos de Privacidad</h2>
          
          <div className="legal-subsection">
            <h3>5.1 Derechos bajo GDPR (UE/EEA)</h3>
            <ul className="legal-list rights-list">
              <li>
                <strong>Acceso:</strong> Solicitar copia de sus datos
              </li>
              <li>
                <strong>Rectificación:</strong> Corregir datos incorrectos
              </li>
              <li>
                <strong>Borrado ("Derecho al Olvido"):</strong> Eliminar datos off-chain 
                (datos on-chain son inmutables)
              </li>
              <li>
                <strong>Portabilidad:</strong> Exportar datos en formato JSON
              </li>
              <li>
                <strong>Restricción de procesamiento:</strong> Limitar uso de datos
              </li>
              <li>
                <strong>Oposición:</strong> Rechazar procesamiento para marketing
              </li>
              <li>
                <strong>Decisiones automatizadas:</strong> No usar IA sin supervisión humana 
                para decisiones críticas
              </li>
            </ul>
          </div>

          <div className="legal-subsection">
            <h3>5.2 Derechos bajo CCPA (California)</h3>
            <p>Residentes de California tienen derecho a:</p>
            <ul className="legal-list">
              <li>Conocer qué datos recopilamos y cómo los usamos</li>
              <li>Eliminar datos personales</li>
              <li>Optar por no vender datos (no aplicable - no vendemos datos)</li>
              <li>No discriminación por ejercer derechos</li>
            </ul>
          </div>

          <div className="legal-subsection">
            <h3>5.3 Cómo Ejercer Sus Derechos</h3>
            <p>Contacte a nuestro Data Protection Officer:</p>
            <div className="legal-contact">
              <p><strong>Email:</strong> privacy@gigchain.io</p>
              <p><strong>Formulario:</strong> gigchain.io/privacy-request</p>
              <p><strong>Respuesta:</strong> Dentro de 30 días</p>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>6. Seguridad de Datos</h2>
          <p>Implementamos medidas de seguridad robustas:</p>
          <ul className="legal-list security-list">
            <li>
              <strong>Encriptación:</strong> TLS 1.3 para datos en tránsito, AES-256 en reposo
            </li>
            <li>
              <strong>Wallets multi-sig:</strong> Fondos de escrow en contratos auditados
            </li>
            <li>
              <strong>Auditorías:</strong> Pentests trimestrales por firmas externas
            </li>
            <li>
              <strong>Acceso restringido:</strong> Solo personal autorizado accede a servidores
            </li>
            <li>
              <strong>Monitoreo 24/7:</strong> Detección de intrusiones automática
            </li>
            <li>
              <strong>Bug bounty:</strong> Programa de recompensas por vulnerabilidades
            </li>
          </ul>
          <div className="legal-note">
            <Shield size={18} />
            <p>
              <strong>Importante:</strong> Ningún sistema es 100% seguro. Mantenga sus claves 
              privadas seguras y use autenticación de dos factores.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>7. Privacidad de Menores</h2>
          <p>
            GigChain no está dirigido a menores de 18 años. No recopilamos intencionalmente datos 
            de menores. Si descubrimos que un menor nos proporcionó datos, los eliminaremos inmediatamente.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Cambios a Esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad para reflejar cambios en prácticas o 
            regulaciones. Los cambios materiales serán notificados con 30 días de anticipación.
          </p>
          <p className="policy-version">
            <strong>Versión actual:</strong> 2.1 | <strong>Fecha efectiva:</strong> 6 Octubre 2025
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Contacto</h2>
          <p>Para preguntas sobre privacidad:</p>
          <div className="legal-contact">
            <p><strong>Data Protection Officer:</strong> dpo@gigchain.io</p>
            <p><strong>Dirección:</strong> [Dirección física si requerido por GDPR]</p>
            <p><strong>Autoridad de Control (UE):</strong> [Enlace a autoridad local]</p>
          </div>
        </section>

        <div className="legal-acceptance">
          <Eye size={24} />
          <p>
            Al usar GigChain, usted consiente esta Política de Privacidad. Puede revocar su 
            consentimiento en cualquier momento cesando el uso de la plataforma.
          </p>
        </div>
      </div>

      {onClose && (
        <div className="legal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Volver
          </button>
          <button className="btn-primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicy;
