import React from 'react';
import { AlertTriangle, Ban, Shield, FileX } from 'lucide-react';
import './Legal.css';

const ProhibitedActivities = ({ onClose }) => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <AlertTriangle className="legal-icon prohibited-icon" />
        <h1>Actividades Prohibidas y Uso Ilegal</h1>
        <p className="legal-subtitle">Restricciones de uso de GigChain.io</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>Política de Tolerancia Cero</h2>
          <div className="legal-warning-box">
            <Ban size={32} />
            <div>
              <h3>ADVERTENCIA IMPORTANTE</h3>
              <p>
                GigChain opera bajo estricta conformidad con leyes internacionales. El uso de la 
                plataforma para actividades ilegales resultará en:
              </p>
              <ul>
                <li>Bloqueo permanente de wallet</li>
                <li>Reporte a autoridades competentes</li>
                <li>Pérdida de fondos en escrow (confiscados según ley)</li>
                <li>Acciones legales civiles y criminales</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>1. Actividades Estrictamente Prohibidas</h2>
          
          <div className="prohibited-category">
            <h3>
              <AlertTriangle size={20} />
              1.1 Crimen Financiero
            </h3>
            <ul className="legal-list prohibited">
              <li>
                <strong>Lavado de dinero (AML):</strong> Usar GigChain para limpiar fondos de 
                origen criminal
              </li>
              <li>
                <strong>Financiación del terrorismo (CFT):</strong> Enviar fondos a organizaciones 
                terroristas listadas
              </li>
              <li>
                <strong>Evasión fiscal:</strong> Ocultar ingresos a autoridades fiscales
              </li>
              <li>
                <strong>Fraude:</strong> Contratos engañosos, esquemas Ponzi, estafas
              </li>
              <li>
                <strong>Robo:</strong> Vender servicios/productos robados
              </li>
              <li>
                <strong>Insider trading:</strong> Uso de información privilegiada para lucro
              </li>
            </ul>
          </div>

          <div className="prohibited-category">
            <h3>
              <Ban size={20} />
              1.2 Contenido y Servicios Ilegales
            </h3>
            <ul className="legal-list prohibited">
              <li>
                <strong>Material ilegal:</strong> Pornografía infantil (CSAM), contenido extremista
              </li>
              <li>
                <strong>Drogas ilegales:</strong> Venta de narcóticos, precursores químicos
              </li>
              <li>
                <strong>Armas:</strong> Venta ilegal de armas de fuego, explosivos
              </li>
              <li>
                <strong>Tráfico humano:</strong> Servicios de trata de personas, esclavitud
              </li>
              <li>
                <strong>Documentos falsos:</strong> IDs falsas, pasaportes, diplomas
              </li>
              <li>
                <strong>Hacking malicioso:</strong> Servicios de hacking ilegal, malware
              </li>
            </ul>
          </div>

          <div className="prohibited-category">
            <h3>
              <FileX size={20} />
              1.3 Violación de Derechos
            </h3>
            <ul className="legal-list prohibited">
              <li>
                <strong>Propiedad intelectual:</strong> Venta de software pirata, contenido con 
                copyright sin autorización
              </li>
              <li>
                <strong>Datos robados:</strong> Venta de bases de datos personales, tarjetas de 
                crédito robadas
              </li>
              <li>
                <strong>Identidad falsa:</strong> Suplantación de identidad, KYC falso
              </li>
              <li>
                <strong>Difamación:</strong> Servicios para dañar reputación de terceros
              </li>
            </ul>
          </div>

          <div className="prohibited-category">
            <h3>
              <Shield size={20} />
              1.4 Manipulación de Plataforma
            </h3>
            <ul className="legal-list prohibited">
              <li>
                <strong>Manipulación de reputación:</strong> Compra/venta de reviews, bots de rating
              </li>
              <li>
                <strong>Ataques técnicos:</strong> DDoS, exploits de smart contracts, phishing
              </li>
              <li>
                <strong>Cuentas múltiples:</strong> Evasión de bans mediante wallets nuevas (Sybil attacks)
              </li>
              <li>
                <strong>Spam:</strong> Flooding de contratos falsos, mensajes masivos no solicitados
              </li>
            </ul>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. Jurisdicciones y Sanciones Bloqueadas</h2>
          <p>
            Por cumplimiento de sanciones internacionales (OFAC, ONU, UE), bloqueamos wallets de:
          </p>
          <div className="sanctions-list">
            <h4>Países Sancionados (Lista actualizada regularmente)</h4>
            <ul className="legal-list">
              <li>Corea del Norte (DPRK)</li>
              <li>Irán (restricciones específicas)</li>
              <li>Siria (restricciones específicas)</li>
              <li>Crimea, Donetsk, Luhansk (regiones de Ucrania)</li>
              <li>Cuba (restricciones según jurisdicción)</li>
            </ul>
            <p className="legal-note">
              <strong>Nota:</strong> Esta lista puede cambiar según actualizaciones de OFAC/ONU. 
              Verificamos wallets contra listas públicas de Chainalysis/Elliptic.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>3. Actividades Restringidas (Requieren Verificación)</h2>
          <p>
            Las siguientes actividades son legales pero requieren KYC avanzado:
          </p>
          <ul className="legal-list restricted">
            <li>
              <strong>Contratos &gt;$10,000 USD:</strong> Verificación de identidad completa
            </li>
            <li>
              <strong>Servicios financieros:</strong> Asesoría de inversión, contabilidad (licencias aplicables)
            </li>
            <li>
              <strong>Servicios médicos:</strong> Telemedicina (verificación de licencia médica)
            </li>
            <li>
              <strong>Servicios legales:</strong> Abogacía (verificación de colegiatura)
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Detección y Enforcement</h2>
          
          <div className="legal-subsection">
            <h3>4.1 Monitoreo Automático</h3>
            <p>Usamos herramientas de compliance blockchain:</p>
            <ul className="legal-list">
              <li>
                <strong>Chainalysis/Elliptic:</strong> Screening de wallets contra listas de sanciones
              </li>
              <li>
                <strong>IA de detección:</strong> Análisis de patrones de transacciones sospechosas
              </li>
              <li>
                <strong>Reportes comunitarios:</strong> Sistema de flagging por usuarios
              </li>
            </ul>
          </div>

          <div className="legal-subsection">
            <h3>4.2 Proceso de Investigación</h3>
            <p>Si su wallet es flaggeada:</p>
            <ol className="legal-list">
              <li>Suspensión temporal de cuenta (fondos en escrow protegidos)</li>
              <li>Notificación por email con detalles (si proporcionó email)</li>
              <li>Periodo de 7 días para apelar con evidencia</li>
              <li>Revisión por equipo de compliance + IA</li>
              <li>Decisión final (desbloqueo o ban permanente)</li>
            </ol>
          </div>

          <div className="legal-subsection">
            <h3>4.3 Consecuencias de Violación</h3>
            <div className="consequences-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Severidad</th>
                    <th>Primera Vez</th>
                    <th>Reincidencia</th>
                    <th>Grave</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Menor (spam)</td>
                    <td>Advertencia</td>
                    <td>Suspensión 30 días</td>
                    <td>Ban permanente</td>
                  </tr>
                  <tr>
                    <td>Moderada (fraude)</td>
                    <td>Suspensión 90 días</td>
                    <td>Ban permanente</td>
                    <td>Reporte a autoridades</td>
                  </tr>
                  <tr>
                    <td>Grave (crimen)</td>
                    <td>Ban permanente inmediato + reporte a policía/Interpol</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>5. Reportar Actividad Sospechosa</h2>
          <p>
            Si encuentra actividad ilegal en GigChain, repórtela inmediatamente:
          </p>
          <div className="legal-contact">
            <p><strong>Email de Compliance:</strong> compliance@gigchain.io</p>
            <p><strong>Formulario anónimo:</strong> gigchain.io/report-abuse</p>
            <p><strong>Emergencias:</strong> Contacte a su policía local primero</p>
          </div>
          <div className="legal-highlight">
            <Shield size={20} />
            <p>
              <strong>Protección de whistleblowers:</strong> Reportes genuinos de actividad ilegal 
              son confidenciales y protegidos contra represalias.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>6. Cooperación con Autoridades</h2>
          <p>
            GigChain coopera plenamente con agencias de aplicación de la ley:
          </p>
          <ul className="legal-list">
            <li>Respondemos a subpoenas y órdenes judiciales válidas</li>
            <li>Proporcionamos datos on-chain públicos y logs de actividad</li>
            <li>Bloqueamos wallets bajo orden de congelación de activos</li>
            <li>Participamos en investigaciones de Interpol/FBI/Europol</li>
          </ul>
          <p className="legal-note">
            <strong>Transparencia:</strong> Publicamos informes anuales de solicitudes de autoridades 
            (Transparency Report).
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Actualizaciones de Esta Política</h2>
          <p>
            Esta lista de actividades prohibidas se actualiza regularmente según cambios en 
            regulaciones. Revise esta página antes de crear contratos de alto valor.
          </p>
          <p className="policy-version">
            <strong>Última actualización:</strong> 6 Octubre 2025 | <strong>Próxima revisión:</strong> Enero 2026
          </p>
        </section>

        <div className="legal-acceptance prohibited-warning">
          <AlertTriangle size={32} />
          <div>
            <h3>DECLARACIÓN DE USO LEGAL</h3>
            <p>
              Al usar GigChain, usted declara bajo pena de perjurio que:
            </p>
            <ul>
              <li>No utilizará la plataforma para actividades ilegales</li>
              <li>Cumplirá con todas las leyes aplicables en su jurisdicción</li>
              <li>Reportará actividad sospechosa que encuentre</li>
              <li>Acepta las consecuencias de violación (incluyendo acciones legales)</li>
            </ul>
          </div>
        </div>
      </div>

      {onClose && (
        <div className="legal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Volver
          </button>
          <button className="btn-primary" onClick={onClose}>
            Entiendo y Acepto
          </button>
        </div>
      )}
    </div>
  );
};

export default ProhibitedActivities;
