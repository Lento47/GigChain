import React from 'react';
import { FileCode, Github, Shield, Code, AlertCircle } from 'lucide-react';
import '../../styles/components/legal.css';

const License = ({ onClose }) => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <FileCode className="legal-icon" />
        <h1>Licencia de Software y Código Abierto</h1>
        <p className="legal-subtitle">MIT License con Atribución Requerida</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>Filosofía Open Source de GigChain</h2>
          <p>
            GigChain.io está comprometido con la transparencia y la descentralización. Nuestro 
            código fuente está disponible públicamente para auditoría, contribuciones y uso bajo 
            los términos de esta licencia.
          </p>
          <div className="legal-highlight">
            <Github size={20} />
            <p>
              <strong>Repositorio GitHub:</strong> <a href="https://github.com/gigchain/platform" target="_blank" rel="noopener">github.com/gigchain/platform</a>
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>1. Componentes del Proyecto</h2>
          
          <div className="component-grid">
            <div className="component-card">
              <h3>Frontend (React)</h3>
              <p><strong>Licencia:</strong> MIT</p>
              <p><strong>Incluye:</strong> UI components, hooks, utils</p>
              <p><strong>Repositorio:</strong> /frontend</p>
            </div>
            
            <div className="component-card">
              <h3>Backend (FastAPI)</h3>
              <p><strong>Licencia:</strong> MIT</p>
              <p><strong>Incluye:</strong> API, AI agents, chat</p>
              <p><strong>Repositorio:</strong> /backend</p>
            </div>
            
            <div className="component-card">
              <h3>Smart Contracts (Solidity)</h3>
              <p><strong>Licencia:</strong> MIT</p>
              <p><strong>Incluye:</strong> Escrow, arbitraje, reputación</p>
              <p><strong>Repositorio:</strong> /contracts</p>
            </div>
            
            <div className="component-card">
              <h3>Documentación</h3>
              <p><strong>Licencia:</strong> CC BY 4.0</p>
              <p><strong>Incluye:</strong> Docs, tutoriales, guías</p>
              <p><strong>Repositorio:</strong> /docs</p>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. Licencia MIT (Texto Completo)</h2>
          <div className="license-box">
            <Code size={20} />
            <pre className="license-text">
{`MIT License

Copyright (c) 2025 GigChain.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
            </pre>
          </div>
        </section>

        <section className="legal-section">
          <h2>3. Cláusulas Adicionales de GigChain</h2>
          
          <div className="legal-subsection">
            <h3>3.1 Atribución Requerida</h3>
            <p>
              Si utiliza código de GigChain en su proyecto, debe:
            </p>
            <ul className="legal-list">
              <li>
                Incluir aviso de copyright "Powered by GigChain.io" en UI visible
              </li>
              <li>
                Enlazar a <code>https://gigchain.io</code> en créditos o footer
              </li>
              <li>
                Mantener comentarios de atribución en código fuente
              </li>
              <li>
                No remover marcas registradas de GigChain sin autorización escrita
              </li>
            </ul>
            <div className="code-example">
              <p><strong>Ejemplo de atribución correcta:</strong></p>
              <code>
                {`<!-- Footer -->\n<p>Powered by <a href="https://gigchain.io">GigChain.io</a></p>`}
              </code>
            </div>
          </div>

          <div className="legal-subsection">
            <h3>3.2 Uso Comercial</h3>
            <p>
              <strong>Permitido:</strong> Usar GigChain en proyectos comerciales, incluir en productos 
              de pago, forks con fines de lucro.
            </p>
            <p>
              <strong>Requiere licencia separada:</strong> Usar "GigChain" en nombre de su producto 
              (ej: "GigChain Pro"), revender como SaaS sin cambios significativos.
            </p>
          </div>

          <div className="legal-subsection">
            <h3>3.3 Modificación y Redistribución</h3>
            <p>Puede modificar y redistribuir GigChain siempre que:</p>
            <ul className="legal-list">
              <li>Mantenga la licencia MIT en archivos modificados</li>
              <li>Indique claramente los cambios realizados</li>
              <li>No implique endorsement oficial de GigChain.io</li>
              <li>Publique smart contracts modificados para auditoría pública</li>
            </ul>
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
          <h2>6. Contribuciones al Proyecto</h2>
          
          <div className="legal-subsection">
            <h3>6.1 Contributor License Agreement (CLA)</h3>
            <p>
              Al enviar pull requests a GigChain, usted acepta que:
            </p>
            <ul className="legal-list">
              <li>Su contribución se licencia bajo MIT</li>
              <li>Tiene derechos para licenciar el código que envía</li>
              <li>No envía código con patentes restrictivas</li>
              <li>Acepta que su código pueda ser usado comercialmente</li>
            </ul>
          </div>

          <div className="legal-subsection">
            <h3>6.2 Guías de Contribución</h3>
            <p>
              Consulte <code>CONTRIBUTING.md</code> en GitHub para:
            </p>
            <ul className="legal-list">
              <li>Código de conducta de la comunidad</li>
              <li>Estándares de código (linting, tests)</li>
              <li>Proceso de revisión de PRs</li>
              <li>Programa de recompensas por bugs</li>
            </ul>
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
          <h2>9. Contacto para Licencias Comerciales</h2>
          <p>
            Para licencias personalizadas, uso de marca o partnerships:
          </p>
          <div className="legal-contact">
            <p><strong>Email:</strong> licensing@gigchain.io</p>
            <p><strong>Business Development:</strong> partnerships@gigchain.io</p>
            <p><strong>Legal:</strong> legal@gigchain.io</p>
          </div>
        </section>

        <div className="legal-acceptance">
          <Github size={24} />
          <p>
            Al usar o contribuir a GigChain, usted acepta los términos de esta licencia MIT 
            con las cláusulas adicionales especificadas.
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
