import React from 'react';
import { FileCode, Github, Shield, Code, AlertCircle } from 'lucide-react';
import '../../styles/components/legal.css';

const License = ({ onClose }) => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <FileCode className="legal-icon" />
        <h1>Licencia de Software y Código Source-Available</h1>
        <p className="legal-subtitle">GigChain Business Source License (GBSL) v1.0</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>Filosofía de Transparencia con Protección Comercial</h2>
          <p>
            GigChain.io está comprometido con la <strong>transparencia</strong> y la <strong>auditoría pública</strong> 
            de nuestro código, pero protegiendo nuestro modelo de negocio. Nuestro código fuente está disponible 
            bajo una licencia <strong>Source-Available</strong> que permite inspección y contribuciones, pero 
            restringe el uso comercial no autorizado.
          </p>
          <div className="legal-warning">
            <AlertCircle size={20} />
            <div>
              <h4>IMPORTANTE: No es Open Source Tradicional</h4>
              <p>
                Esta NO es una licencia MIT, Apache o GPL. Es una <strong>licencia propietaria source-available</strong>. 
                Puedes ver, auditar y contribuir al código, pero <strong>NO puedes usarlo comercialmente</strong> 
                sin una licencia comercial de GigChain.io.
              </p>
            </div>
          </div>
          <div className="legal-highlight">
            <Github size={20} />
            <p>
              <strong>Repositorio GitHub:</strong> <a href="https://github.com/gigchain/platform" target="_blank" rel="noopener">github.com/gigchain/platform-public</a> (Código Core)
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>1. Componentes del Proyecto y Visibilidad</h2>
          
          <div className="legal-subsection">
            <h3>1.1 Código Público (Source-Available)</h3>
            <p>Disponible en GitHub para auditoría bajo GBSL:</p>
            <div className="component-grid">
              <div className="component-card public">
                <h3>Frontend Core (React)</h3>
                <p><strong>Licencia:</strong> GBSL v1.0</p>
                <p><strong>Incluye:</strong> UI básico, componentes layout</p>
                <p><strong>Repositorio:</strong> /frontend-public</p>
              </div>
              
              <div className="component-card public">
                <h3>Smart Contracts (Solidity)</h3>
                <p><strong>Licencia:</strong> GBSL v1.0</p>
                <p><strong>Incluye:</strong> Contratos auditados, interfaces</p>
                <p><strong>Repositorio:</strong> /contracts-public</p>
              </div>
              
              <div className="component-card public">
                <h3>Documentación Pública</h3>
                <p><strong>Licencia:</strong> CC BY-NC 4.0</p>
                <p><strong>Incluye:</strong> Docs de usuario, API reference</p>
                <p><strong>Repositorio:</strong> /docs-public</p>
              </div>
            </div>
          </div>

          <div className="legal-subsection">
            <h3>1.2 Código Privado (Propietario)</h3>
            <p>NO disponible públicamente - Propiedad exclusiva de GigChain.io:</p>
            <div className="component-grid">
              <div className="component-card private">
                <h3>🔒 AI Agents Avanzados</h3>
                <p><strong>Licencia:</strong> Propietaria</p>
                <p><strong>Incluye:</strong> Modelos entrenados, prompts optimizados</p>
                <p><strong>Razón:</strong> Ventaja competitiva core</p>
              </div>
              
              <div className="component-card private">
                <h3>🔒 Backend Completo (FastAPI)</h3>
                <p><strong>Licencia:</strong> Propietaria</p>
                <p><strong>Incluye:</strong> Lógica de negocio, integraciones</p>
                <p><strong>Razón:</strong> Secretos comerciales</p>
              </div>
              
              <div className="component-card private">
                <h3>🔒 Features en Desarrollo</h3>
                <p><strong>Licencia:</strong> Propietaria</p>
                <p><strong>Incluye:</strong> Innovaciones no lanzadas</p>
                <p><strong>Razón:</strong> Roadmap estratégico</p>
              </div>

              <div className="component-card private">
                <h3>🔒 Infraestructura</h3>
                <p><strong>Licencia:</strong> Propietaria</p>
                <p><strong>Incluye:</strong> DevOps, scripts deployment</p>
                <p><strong>Razón:</strong> Seguridad operacional</p>
              </div>
            </div>
          </div>

          <div className="legal-note">
            <Shield size={18} />
            <p>
              <strong>Estrategia:</strong> Publicamos código suficiente para demostrar transparencia 
              y permitir auditorías, pero protegemos la propiedad intelectual que nos da ventaja competitiva.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. GigChain Business Source License (GBSL) v1.0 - Texto Completo</h2>
          <div className="license-box commercial">
            <Code size={20} />
            <pre className="license-text">
{`GigChain Business Source License (GBSL) v1.0
==============================================

Copyright (c) 2025 GigChain.io - Todos los derechos reservados.

TÉRMINOS Y CONDICIONES DE USO

1. DEFINICIONES
   "Software" se refiere al código fuente, binarios y documentación de GigChain.
   "Uso Comercial" es cualquier uso con fines de lucro o en producción.
   "Uso No Comercial" es educación, investigación y auditoría.
   "Licencia Comercial" es un acuerdo de pago con GigChain.io.

2. CONCESIÓN DE DERECHOS LIMITADOS
   Se concede permiso para:
   ✓ Ver y auditar el código fuente
   ✓ Ejecutar el Software localmente para desarrollo/testing
   ✓ Contribuir mejoras mediante Pull Requests
   ✓ Reportar bugs y vulnerabilidades
   ✓ Investigación académica sin fines comerciales

3. RESTRICCIONES (ESTRICTAMENTE PROHIBIDO SIN LICENCIA COMERCIAL)
   ✗ Usar el Software en producción con fines comerciales
   ✗ Crear servicios SaaS basados en el Software
   ✗ Redistribuir el Software (modificado o no)
   ✗ Crear productos derivados para venta
   ✗ Usar el Software para competir con GigChain.io
   ✗ Sublicenciar o vender acceso al Software
   ✗ Remover o modificar avisos de copyright

4. USO COMERCIAL
   Para uso comercial, debe obtener una Licencia Comercial de:
   Email: licensing@gigchain.io
   Web: https://gigchain.io/commercial-license
   
   Precios:
   - Startup (<10 empleados): $5,000/año
   - Empresa (10-100 empleados): $25,000/año
   - Enterprise (>100 empleados): Contactar ventas

5. CONTRIBUCIONES
   Al contribuir código (Pull Requests), usted:
   a) Cede todos los derechos de propiedad intelectual a GigChain.io
   b) Acepta que GigChain.io puede licenciar comercialmente su contribución
   c) Garantiza que tiene derechos para contribuir el código
   d) Acepta que no recibirá compensación monetaria automática

6. PATENTES
   GigChain.io se reserva todos los derechos de patentes sobre el Software.
   Esta licencia NO concede derechos de patente.

7. TRANSICIÓN A OPEN SOURCE
   Después de 4 años desde cada release, el código puede convertirse a MIT.
   Ej: Código de 2025 → MIT en 2029 (si GigChain.io lo decide).
   
   Razón: Dar valor a early adopters, pero eventualmente liberar código obsoleto.

8. GARANTÍAS
   EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍAS.
   GIGCHAIN.IO NO ES RESPONSABLE DE DAÑOS DERIVADOS DEL USO.

9. TERMINACIÓN
   Esta licencia termina automáticamente si viola cualquier término.
   Debe destruir todas las copias del Software inmediatamente.

10. LEY APLICABLE
    Esta licencia se rige por las leyes de [JURISDICCIÓN].
    Disputas se resolverán mediante arbitraje vinculante.

Para preguntas: legal@gigchain.io
Última actualización: 6 Octubre 2025`}
            </pre>
          </div>
          
          <div className="legal-warning">
            <AlertCircle size={20} />
            <div>
              <h4>Resumen en Lenguaje Simple</h4>
              <ul>
                <li><strong>Puedes:</strong> Ver código, testearlo localmente, reportar bugs, contribuir mejoras</li>
                <li><strong>NO puedes:</strong> Usarlo para tu negocio, crear SaaS, venderlo, competir con nosotros</li>
                <li><strong>Si quieres usarlo comercialmente:</strong> Compra una licencia (desde $5k/año)</li>
                <li><strong>Eventualmente:</strong> El código viejo (4+ años) puede volverse MIT License</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>3. Modelo de Licenciamiento Dual</h2>
          
          <div className="legal-subsection">
            <h3>3.1 Licencia GBSL (Por Defecto - Gratis con Restricciones)</h3>
            <p><strong>Para qué sirve:</strong></p>
            <ul className="legal-list">
              <li>✅ Developers pueden auditar el código (transparencia)</li>
              <li>✅ Investigadores pueden estudiar la arquitectura</li>
              <li>✅ Usuarios pueden verificar que no hay backdoors</li>
              <li>✅ Contribuidores pueden mejorar el código</li>
              <li>❌ NO pueden crear competidores comerciales</li>
              <li>❌ NO pueden vender servicios basados en nuestro código</li>
            </ul>
          </div>

          <div className="legal-subsection">
            <h3>3.2 Licencia Comercial (De Pago - Sin Restricciones)</h3>
            <p><strong>Incluye:</strong></p>
            <ul className="legal-list">
              <li>✅ Uso ilimitado en producción</li>
              <li>✅ Crear SaaS o productos derivados</li>
              <li>✅ Soporte técnico prioritario</li>
              <li>✅ Acceso a features empresariales</li>
              <li>✅ Licencia perpetua (pago anual para updates)</li>
              <li>✅ Protección legal contra demandas</li>
            </ul>
            
            <div className="pricing-table">
              <h4>Planes de Licenciamiento Comercial</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Tamaño Empresa</th>
                    <th>Precio/Año</th>
                    <th>Soporte</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Startup</strong></td>
                    <td>&lt;10 empleados</td>
                    <td>$5,000 USD</td>
                    <td>Email (48h)</td>
                  </tr>
                  <tr>
                    <td><strong>Growth</strong></td>
                    <td>10-100 empleados</td>
                    <td>$25,000 USD</td>
                    <td>Chat prioritario (24h)</td>
                  </tr>
                  <tr>
                    <td><strong>Enterprise</strong></td>
                    <td>&gt;100 empleados</td>
                    <td>Contactar ventas</td>
                    <td>Dedicated account manager</td>
                  </tr>
                  <tr>
                    <td><strong>White Label</strong></td>
                    <td>Cualquier tamaño</td>
                    <td>Desde $100,000 USD</td>
                    <td>Personalización completa</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="contact-sales">
              <strong>Contactar Ventas:</strong> sales@gigchain.io | +1 (555) 123-4567
            </p>
          </div>

          <div className="legal-subsection">
            <h3>3.3 Excepciones y Casos Especiales</h3>
            <div className="exception-box">
              <h4>✅ Permitido SIN licencia comercial:</h4>
              <ul>
                <li><strong>ONGs y organizaciones sin fines de lucro:</strong> Uso gratuito previo registro</li>
                <li><strong>Proyectos educativos:</strong> Universidades y bootcamps (mencionar GigChain)</li>
                <li><strong>Investigación académica:</strong> Papers y estudios (citar en publicaciones)</li>
                <li><strong>Hackathons:</strong> Proyectos de 48-72h (no lanzar a producción después)</li>
              </ul>
              
              <h4>❌ Requiere licencia comercial SÍ o SÍ:</h4>
              <ul>
                <li>Cualquier uso en producción con usuarios pagando</li>
                <li>SaaS, marketplace o plataforma basada en GigChain</li>
                <li>Integración en producto comercial existente</li>
                <li>Reventa de acceso al software (hosting, consulting)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>4. Smart Contracts - Licencia Especial</h2>
          <div className="legal-warning">
            <Shield size={20} />
            <div>
              <h4>IMPORTANTE: Auditorías de Seguridad</h4>
              <p>
                Nuestros smart contracts están auditados por firmas certificadas. Si modifica 
                contratos y los despliega, usted es responsable de:
              </p>
              <ul>
                <li>Re-auditar código modificado antes de usar en producción</li>
                <li>No usar marca "GigChain" en contratos no auditados</li>
                <li>Asumir toda responsabilidad por pérdidas de fondos</li>
              </ul>
            </div>
          </div>
          
          <p>Contratos incluidos (todos MIT License):</p>
          <ul className="legal-list">
            <li><code>GigEscrow.sol</code> - Depósito en garantía con releases parciales</li>
            <li><code>ReputationNFT.sol</code> - Sistema de reputación on-chain</li>
            <li><code>DisputeArbitration.sol</code> - Arbitraje descentralizado</li>
            <li><code>GigToken.sol</code> - Token de gobernanza (ERC-20)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Dependencias de Terceros</h2>
          <p>GigChain usa las siguientes bibliotecas open source:</p>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Biblioteca</th>
                <th>Licencia</th>
                <th>Uso</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>React</td>
                <td>MIT</td>
                <td>Frontend framework</td>
              </tr>
              <tr>
                <td>FastAPI</td>
                <td>MIT</td>
                <td>Backend API</td>
              </tr>
              <tr>
                <td>Thirdweb SDK</td>
                <td>Apache 2.0</td>
                <td>Wallet integration</td>
              </tr>
              <tr>
                <td>OpenZeppelin</td>
                <td>MIT</td>
                <td>Smart contract libraries</td>
              </tr>
              <tr>
                <td>OpenAI SDK</td>
                <td>MIT</td>
                <td>AI integration</td>
              </tr>
              <tr>
                <td>Vite</td>
                <td>MIT</td>
                <td>Build tool</td>
              </tr>
            </tbody>
          </table>
          
          <p className="legal-note">
            Ver <code>package.json</code> y <code>requirements.txt</code> para lista completa de dependencias.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Contribuciones al Proyecto y Derechos</h2>
          
          <div className="legal-subsection">
            <h3>6.1 Contributor License Agreement (CLA) - IMPORTANTE</h3>
            <div className="legal-warning">
              <AlertCircle size={20} />
              <div>
                <p><strong>Al contribuir código a GigChain, usted ACEPTA que:</strong></p>
                <ul>
                  <li><strong>Cede TODOS los derechos</strong> de propiedad intelectual a GigChain.io</li>
                  <li>GigChain.io puede <strong>licenciar comercialmente</strong> su contribución sin compensarle</li>
                  <li>Su código puede incluirse en <strong>versiones pagas</strong> del software</li>
                  <li><strong>No recibirá regalías</strong> por uso comercial de su código</li>
                  <li>Garantiza que <strong>tiene derechos</strong> para contribuir el código</li>
                  <li>Su contribución <strong>no viola patentes</strong> ni copyrights de terceros</li>
                </ul>
              </div>
            </div>
            
            <p className="legal-note">
              <strong>Razón:</strong> Necesitamos propiedad completa del código para poder vender licencias 
              comerciales sin conflictos legales. Esto es estándar en software source-available.
            </p>
          </div>

          <div className="legal-subsection">
            <h3>6.2 Programa de Reconocimiento para Contribuidores</h3>
            <p>Aunque no pagamos regalías, SÍ reconocemos contribuciones valiosas:</p>
            <ul className="legal-list">
              <li>🏆 <strong>Hall of Fame</strong> en website para top contributors</li>
              <li>💰 <strong>Bug Bounties:</strong> $500-$5,000 por vulnerabilidades críticas</li>
              <li>🎁 <strong>Licencias gratuitas:</strong> Para contribuidores frecuentes</li>
              <li>📧 <strong>Invitaciones early access:</strong> Features beta exclusivos</li>
              <li>💼 <strong>Ofertas de empleo:</strong> Prioridad en contratación</li>
            </ul>
          </div>

          <div className="legal-subsection">
            <h3>6.3 Proceso de Contribución</h3>
            <ol className="legal-list">
              <li>Fork el repositorio público en GitHub</li>
              <li>Crear branch con nombre descriptivo (<code>fix/bug-name</code>)</li>
              <li>Hacer cambios y commits siguiendo estilo del proyecto</li>
              <li>Firmar CLA digitalmente (automático en primer PR)</li>
              <li>Enviar Pull Request con descripción detallada</li>
              <li>Equipo de GigChain revisa (2-7 días)</li>
              <li>Si se aprueba: Merge + crédito en changelog</li>
            </ol>
            
            <p>Ver guía completa: <code>CONTRIBUTING.md</code> en GitHub</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>7. Marcas Registradas</h2>
          <p>
            "GigChain", el logo de GigChain y otras marcas son propiedad de GigChain.io. 
            La licencia MIT <strong>no</strong> otorga derechos sobre marcas registradas.
          </p>
          <div className="trademark-notice">
            <p><strong>Uso permitido sin autorización:</strong></p>
            <ul>
              <li>Referencias editoriales ("basado en GigChain")</li>
              <li>Atribución requerida (ver sección 3.1)</li>
            </ul>
            <p><strong>Requiere autorización escrita:</strong></p>
            <ul>
              <li>Uso de logo en productos comerciales</li>
              <li>Nombres de dominio con "gigchain"</li>
              <li>Aplicaciones móviles llamadas "GigChain..."</li>
            </ul>
          </div>
        </section>

        <section className="legal-section">
          <h2>8. Descargo de Responsabilidad</h2>
          <div className="legal-warning">
            <AlertCircle size={20} />
            <div>
              <p>
                EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO. LOS AUTORES 
                NO SON RESPONSABLES DE DAÑOS DERIVADOS DEL USO DEL SOFTWARE.
              </p>
              <p>
                Específicamente, no garantizamos que:
              </p>
              <ul>
                <li>Smart contracts estén libres de bugs (aunque auditados)</li>
                <li>La plataforma funcione sin interrupciones</li>
                <li>Datos en blockchain sean inmunes a ataques de 51%</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>9. Contacto y Adquisición de Licencias</h2>
          
          <div className="legal-subsection">
            <h3>9.1 Licencias Comerciales</h3>
            <div className="legal-contact">
              <p><strong>Ventas:</strong> sales@gigchain.io | Teléfono: +1 (555) GIGCHAIN</p>
              <p><strong>Formulario:</strong> <a href="https://gigchain.io/request-license" target="_blank" rel="noopener">gigchain.io/request-license</a></p>
              <p><strong>Presupuesto Enterprise:</strong> partnerships@gigchain.io</p>
            </div>
          </div>

          <div className="legal-subsection">
            <h3>9.2 Consultas Legales</h3>
            <div className="legal-contact">
              <p><strong>Licenciamiento:</strong> licensing@gigchain.io</p>
              <p><strong>Compliance:</strong> legal@gigchain.io</p>
              <p><strong>Violaciones de licencia:</strong> abuse@gigchain.io</p>
            </div>
          </div>

          <div className="legal-subsection">
            <h3>9.3 Reportar Uso No Autorizado</h3>
            <p>
              Si encuentra alguien usando GigChain comercialmente sin licencia, repórtelo:
            </p>
            <div className="legal-contact">
              <p><strong>Email:</strong> violations@gigchain.io</p>
              <p><strong>Recompensa:</strong> Hasta 10% del valor de licencia recuperada</p>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>10. Estrategia de Monetización y Roadmap</h2>
          
          <div className="legal-subsection">
            <h3>10.1 Modelo de Negocio</h3>
            <p>GigChain.io opera con un modelo <strong>dual-licensing</strong>:</p>
            <div className="business-model">
              <div className="revenue-stream">
                <h4>💰 Fuentes de Ingreso</h4>
                <ul>
                  <li><strong>70%:</strong> Licencias comerciales (SaaS, enterprise)</li>
                  <li><strong>15%:</strong> Servicios profesionales (implementación, training)</li>
                  <li><strong>10%:</strong> White-label customizations</li>
                  <li><strong>5%:</strong> Soporte premium y SLAs</li>
                </ul>
              </div>
              
              <div className="revenue-stream">
                <h4>📈 Proyección de Crecimiento</h4>
                <ul>
                  <li><strong>Año 1:</strong> 50 licencias Startup = $250k ARR</li>
                  <li><strong>Año 2:</strong> 200 licencias + 20 Growth = $750k ARR</li>
                  <li><strong>Año 3:</strong> 500 licencias + 100 Growth + 5 Enterprise = $3M ARR</li>
                  <li><strong>Año 5:</strong> 10,000+ usuarios, $20M+ ARR</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="legal-subsection">
            <h3>10.2 Transición a Open Source (Delayed Open Source)</h3>
            <p>
              Cada versión del software se convierte en <strong>MIT License después de 4 años</strong>:
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Versión</th>
                  <th>Release Date</th>
                  <th>Licencia Actual</th>
                  <th>Fecha MIT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>v1.0</td>
                  <td>Octubre 2025</td>
                  <td>GBSL v1.0</td>
                  <td>Octubre 2029</td>
                </tr>
                <tr>
                  <td>v2.0</td>
                  <td>Enero 2026</td>
                  <td>GBSL v1.0</td>
                  <td>Enero 2030</td>
                </tr>
                <tr>
                  <td>v3.0</td>
                  <td>Junio 2026</td>
                  <td>GBSL v1.0</td>
                  <td>Junio 2030</td>
                </tr>
              </tbody>
            </table>
            
            <p className="legal-note">
              <strong>Ventaja:</strong> Código viejo (4+ años) es obsoleto pero útil para la comunidad. 
              Mantiene incentivo para comprar licencias de versiones actuales.
            </p>
          </div>
        </section>

        <div className="legal-acceptance">
          <Github size={24} />
          <p>
            Al usar o contribuir a GigChain, usted acepta los términos de la GigChain Business 
            Source License (GBSL) v1.0. Para uso comercial, contacte a sales@gigchain.io.
          </p>
        </div>
      </div>

      {onClose && (
        <div className="legal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Volver
          </button>
          <a href="https://github.com/gigchain/platform" target="_blank" rel="noopener" className="btn-primary">
            Ver en GitHub
          </a>
        </div>
      )}
    </div>
  );
};

export default License;
