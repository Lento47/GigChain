# 🔐 Guía de Separación de Código: Público vs Privado - GigChain.io

## 📊 Resumen Ejecutivo

**Estrategia:** Publicar **30% del código** (transparencia) y mantener **70% privado** (ventaja competitiva)

**Licencia Pública:** GigChain Business Source License (GBSL) v1.0 - Source-Available, NO Open Source  
**Licencia Privada:** Propietaria - Solo GigChain.io

---

## ✅ Código Público (GitHub: `gigchain/platform-public`)

### 🎨 Frontend Core (30% del total)

**Repositorio:** `/frontend-public`

#### Publicar (Source-Available):
```
frontend-public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx          ✅ Estructura básica
│   │   │   ├── Sidebar.jsx         ✅ UI básica (sin lógica compleja)
│   │   │   └── Footer.jsx          ✅ Footer estándar
│   │   ├── ui/
│   │   │   ├── Button.jsx          ✅ Componentes genéricos
│   │   │   ├── Modal.jsx           ✅ Reutilizables
│   │   │   ├── Input.jsx           ✅ Sin lógica de negocio
│   │   │   └── Card.jsx            ✅ UI atoms
│   │   └── legal/
│   │       ├── TermsOfService.jsx  ✅ Contenido legal público
│   │       ├── PrivacyPolicy.jsx   ✅ Transparencia
│   │       └── License.jsx         ✅ Info de licenciamiento
│   ├── hooks/
│   │   ├── useWallet.js            ✅ Básico (sin features avanzados)
│   │   └── useContract.js          ✅ Wrapper simple de Thirdweb
│   ├── utils/
│   │   ├── formatters.js           ✅ Date, number formatters
│   │   ├── validators.js           ✅ Form validation básica
│   │   └── constants.js            ✅ Constantes públicas
│   └── styles/
│       └── *.css                   ✅ Estilos base (sin optimizaciones avanzadas)
```

**Total:** ~3,000 líneas de código (30%)

---

### ⛓️ Smart Contracts Auditados (100% - Transparencia blockchain)

**Repositorio:** `/contracts-public`

#### Publicar (DEBE ser público para auditoría):
```
contracts-public/
├── contracts/
│   ├── GigEscrow.sol               ✅ Versión básica (single-token)
│   ├── ReputationNFT.sol           ✅ Sistema de reputación estándar
│   ├── DisputeArbitration.sol      ✅ Arbitraje básico
│   └── interfaces/
│       ├── IGigEscrow.sol          ✅ Todas las interfaces públicas
│       └── IReputation.sol         ✅ Para integraciones
├── test/
│   └── *.test.js                   ✅ Tests públicos (transparencia)
├── scripts/
│   └── deploy-public.js            ✅ Script básico de deployment
└── audits/
    └── audit-report-2025.pdf       ✅ Reportes de auditorías
```

**Razón:** Smart contracts DEBEN ser públicos para verificación en blockchain.

**NO Publicar (Enterprise features):**
- `GigEscrowMultiToken.sol` - Escrow con múltiples tokens (feature enterprise)
- `OptimizedGasEscrow.sol` - Optimizaciones propietarias (ahorro 40% gas)
- `AdvancedArbitration.sol` - AI-powered dispute resolution

**Total:** ~1,500 líneas de contratos básicos

---

### 📚 Documentación Pública

**Repositorio:** `/docs-public`

#### Publicar:
```
docs-public/
├── user-guides/
│   ├── getting-started.md          ✅ Tutorial básico
│   ├── connecting-wallet.md        ✅ Setup wallet
│   └── creating-contracts.md       ✅ Guía de uso
├── api/
│   ├── api-reference.md            ✅ Endpoints públicos básicos
│   └── smart-contracts-abi.json    ✅ ABIs de contratos públicos
└── faq.md                          ✅ Preguntas frecuentes
```

**NO Publicar:**
- `internal-architecture.md` - Arquitectura detallada
- `ai-models-guide.md` - Prompt engineering secrets
- `deployment-infrastructure.md` - Secrets de DevOps

**Total:** ~100 páginas de docs

---

## 🔒 Código Privado (GitHub: `gigchain/platform-private`)

### 🤖 Backend Completo (100% Privado)

**Repositorio:** `/backend-private` (NUNCA publicar)

```
backend-private/
├── main.py                         🔒 Entry point con lógica de negocio
├── app.py                          🔒 FastAPI app completa
├── agents/
│   ├── negotiation_agent.py        🔒 AI de negociación (CORE VALUE)
│   ├── contract_generator_agent.py 🔒 Generación de contratos con AI
│   ├── dispute_resolver_agent.py   🔒 Resolución de disputas
│   └── prompts/
│       ├── negotiation_prompts.py  🔒 Prompts optimizados (meses de testing)
│       ├── contract_templates.py   🔒 Templates AI fine-tuned
│       └── fine_tuned_models/      🔒 Modelos entrenados ($10k+ inversión)
├── chat_ai.py                      🔒 Chat completo con contexto
├── chat_enhanced.py                🔒 Features avanzados de chat
├── contract_ai.py                  🔒 Lógica de contratos inteligentes
├── auth/
│   ├── w_csap.py                   🔒 Sistema de auth propietario
│   ├── middleware.py               🔒 Security middleware custom
│   └── database.py                 🔒 Manejo de datos sensibles
├── security/
│   ├── template_security.py        🔒 Validación de templates
│   └── encryption.py               🔒 Encriptación propietaria
└── integrations/
    ├── openai_integration.py       🔒 Wrapper optimizado de OpenAI
    ├── thirdweb_advanced.py        🔒 Features avanzados de Thirdweb
    └── stripe_payments.py          🔒 Lógica de pagos
```

**Razón para mantener privado:**
- **Prompts de AI:** Meses de optimización, imposible de replicar solo viendo outputs
- **Lógica de negocio:** Core value, diferenciador vs competencia
- **Integraciones:** Secrets de API, optimizaciones propietarias
- **Security:** Vulnerabilidades si se expone
- **Modelos AI:** Inversión de $10k+ en fine-tuning

**Total:** ~10,000 líneas de código backend (70% del valor)

---

### 🚀 Features en Desarrollo (100% Privado)

**Repositorio:** `/features-beta-private`

```
features-beta-private/
├── ai-powered-pricing/             🔒 AI que sugiere precios óptimos
├── multi-chain-support/            🔒 Polygon + Ethereum + BSC + Arbitrum
├── advanced-analytics/             🔒 Dashboard con ML predictions
├── automated-kyc/                  🔒 KYC con Zero-Knowledge Proofs
├── escrow-insurance/               🔒 Seguro de contratos (partnership)
└── mobile-app/                     🔒 React Native app (roadmap Q2 2026)
```

**Razón:** Ventaja competitiva futura, sorpresa de roadmap

**Cuándo publicar:** NUNCA hasta que esté en producción. Luego mover a privado normal.

---

### ⚙️ Infraestructura y DevOps (100% Privado)

**Repositorio:** `/infra-private`

```
infra-private/
├── docker/
│   ├── Dockerfile.prod             🔒 Optimizaciones de build
│   └── docker-compose.prod.yml     🔒 Configuración real de producción
├── scripts/
│   ├── deploy-vps.sh               🔒 Scripts de deployment
│   ├── backup-db.sh                🔒 Backups automatizados
│   └── monitoring-setup.sh         🔒 Setup de monitoreo
├── nginx/
│   └── nginx.prod.conf             🔒 Configuración real (con secrets)
├── ci-cd/
│   ├── github-actions.yml          🔒 Pipelines de CI/CD
│   └── deploy-hooks.js             🔒 Webhooks de deployment
└── secrets/
    ├── .env.production             🔒 API keys reales
    ├── ssl-certs/                  🔒 Certificados SSL
    └── database-credentials.json   🔒 Accesos a DB
```

**Razón:** Seguridad crítica, exponer esto = hackeo fácil

---

### 🎨 Frontend Avanzado (70% Privado)

**Repositorio:** `/frontend-private`

```
frontend-private/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardView.jsx           🔒 Lógica completa de dashboard
│   │   │   ├── InteractiveChart.jsx        🔒 Charts avanzados
│   │   │   └── AIInsights.jsx              🔒 Recomendaciones de AI
│   │   ├── chat/
│   │   │   ├── ChatAIAdvanced.jsx          🔒 Chat con contexto, memoria
│   │   │   └── ChatSuggestions.jsx         🔒 AI suggestions
│   │   ├── contracts/
│   │   │   ├── ContractBuilder.jsx         🔒 Visual contract builder
│   │   │   ├── AITemplateGenerator.jsx     🔒 AI genera contratos
│   │   │   └── ContractAnalytics.jsx       🔒 Analytics avanzados
│   │   └── premium/
│   │       ├── MultiChainSelector.jsx      🔒 Feature enterprise
│   │       └── AdvancedEscrow.jsx          🔒 Escrow multi-token
│   ├── hooks/
│   │   ├── useAIAgent.js                   🔒 Hook para AI agents
│   │   ├── useAdvancedContract.js          🔒 Features avanzados
│   │   └── useRealTimeSync.js              🔒 WebSocket real-time
│   ├── utils/
│   │   ├── ai-helpers.js                   🔒 Utilidades para AI
│   │   ├── blockchain-optimizations.js     🔒 Optimizaciones propietarias
│   │   └── analytics-tracking.js           🔒 Tracking avanzado
│   └── pages/
│       ├── HomePage.jsx                    ⚠️ Versión básica → pública
│       ├── PremiumFeatures.jsx             🔒 Solo para clientes pagos
│       └── EnterpriseAdmin.jsx             🔒 Panel enterprise
```

**Razón:** Features avanzados = diferenciación, UX optimizada = meses de trabajo

---

## 🎯 Criterios de Decisión: ¿Público o Privado?

### ✅ Publicar si:
1. **Es genérico y reutilizable** (componentes UI básicos)
2. **Demuestra transparencia** (legal, docs, smart contracts auditados)
3. **No revela secretos comerciales** (sin lógica de negocio)
4. **No da ventaja a competidores** (código commodity)
5. **Ayuda a auditoría/confianza** (security, blockchain)

### 🔒 Mantener privado si:
1. **Contiene lógica de negocio core** (AI agents, pricing)
2. **Incluye optimizaciones propietarias** (gas savings, performance)
3. **Revela estrategia de producto** (features en desarrollo)
4. **Tiene secrets/credentials** (API keys, configs de infra)
5. **Inversión significativa en R&D** (modelos entrenados, prompts)
6. **Ventaja competitiva clara** (diferenciadores únicos)

---

## 📋 Checklist Antes de Publicar Código

Antes de hacer un commit a repo público, verificar:

- [ ] ❌ **NO contiene API keys** (OpenAI, Thirdweb, Stripe)
- [ ] ❌ **NO contiene credenciales** (DB passwords, JWT secrets)
- [ ] ❌ **NO contiene prompts optimizados** de AI (meses de trabajo)
- [ ] ❌ **NO contiene lógica de pricing** (algoritmos de matching, sugerencias)
- [ ] ❌ **NO contiene features no lanzados** (roadmap secreto)
- [ ] ❌ **NO contiene optimizaciones propietarias** (gas, performance)
- [ ] ✅ **SÍ tiene licencia GBSL** en cada archivo (`// Licensed under GBSL v1.0`)
- [ ] ✅ **SÍ está documentado** suficientemente para auditoría
- [ ] ✅ **SÍ es útil** para demostrar transparencia

---

## 🔄 Proceso de Publicación

### Paso 1: Limpiar Código
```bash
# Remover todos los secrets
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch secrets/*" \
  --prune-empty --tag-name-filter cat -- --all

# Verificar que no haya API keys
git grep -i "api_key"
git grep -i "secret"
git grep -i "password"
```

### Paso 2: Agregar Licencia
Crear `LICENSE.md` en root:
```
GigChain Business Source License (GBSL) v1.0
Copyright (c) 2025 GigChain.io
Ver frontend/src/components/legal/License.jsx para términos completos.
```

Agregar header a cada archivo:
```javascript
/**
 * @license GBSL-1.0
 * @copyright 2025 GigChain.io
 * 
 * Licensed under the GigChain Business Source License v1.0
 * You may not use this file except in compliance with the License.
 * Commercial use requires a commercial license from GigChain.io
 * See LICENSE.md or visit https://gigchain.io/license
 */
```

### Paso 3: Crear Repo Público
```bash
# En GitHub
- Crear repo: gigchain/platform-public (público)
- Settings > Features > Disable: Wikis, Projects, Discussions
- Settings > Branches > Protect: main (require PR reviews)

# Clonar y configurar
git clone git@github.com:gigchain/platform-public.git
cd platform-public
git remote add private git@github.com:gigchain/platform-private.git
```

### Paso 4: Copiar Solo Código Público
```bash
# Crear estructura
mkdir -p frontend-public contracts-public docs-public

# Copiar selectivamente
cp -r ../platform-private/frontend/src/components/ui frontend-public/src/components/
cp -r ../platform-private/frontend/src/components/legal frontend-public/src/components/
# ... etc (solo carpetas aprobadas)

# Verificar que NO haya secrets
rg -i "api.key|secret|password" frontend-public/
```

### Paso 5: Configurar CLA
Agregar `.github/workflows/cla.yml`:
```yaml
name: CLA Assistant
on:
  pull_request_target:
    types: [opened,synchronize]

jobs:
  CLAAssistant:
    runs-on: ubuntu-latest
    steps:
      - uses: contributor-assistant/github-action@v2.3.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          path-to-signatures: 'signatures/cla.json'
          path-to-document: 'https://gigchain.io/cla'
          branch: 'main'
          allowlist: 'bot*'
```

### Paso 6: README Público
Crear `README.md`:
```markdown
# GigChain Platform (Public Source Code)

⚠️ **This code is licensed under GBSL v1.0 (NOT open source)**

## What is this repo?
Public source code for transparency and auditing. You can:
- ✅ View and audit code
- ✅ Report bugs and security issues
- ✅ Contribute improvements (with CLA)
- ❌ Use commercially without a license

## Commercial Use
Requires a commercial license starting at $5,000/year.
Contact: sales@gigchain.io

## License
See [LICENSE.md](LICENSE.md) for full terms.
```

---

## 📊 Estadísticas de Código Público vs Privado

| Componente | Total LOC | Público (GBSL) | Privado | % Público |
|------------|-----------|----------------|---------|-----------|
| Frontend | 8,000 | 2,500 | 5,500 | 31% |
| Backend | 10,000 | 0 | 10,000 | 0% |
| Smart Contracts | 2,000 | 1,500 | 500 | 75% |
| Docs | 500 páginas | 100 | 400 | 20% |
| Infra/DevOps | 1,000 | 0 | 1,000 | 0% |
| **TOTAL** | **21,000** | **4,100** | **16,900** | **20%** |

**Resultado:** Solo ~20% del código es público (suficiente para auditoría, insuficiente para competir)

---

## 🚨 Qué Hacer Si Alguien Copia El Código

### Escenario 1: Uso No Comercial (OK)
- Universidad usa código para proyecto académico → ✅ Permitido
- **Acción:** Pedir que citen a GigChain en paper

### Escenario 2: Uso Comercial Sin Licencia (Violación)
- Startup lanza competidor usando nuestro código → ❌ Violación GBSL
- **Acción:**
  1. Enviar Cease & Desist letter (plantilla en `/legal/templates/`)
  2. Dar 30 días para: a) Detener uso, o b) Comprar licencia
  3. Si ignoran: Demanda por infracción de copyright ($50k-$500k damages)

### Escenario 3: Fork Malicioso (Robo)
- Alguien hace fork, cambia nombres, vende como propio → ❌ Robo de IP
- **Acción:**
  1. DMCA takedown en GitHub (respuesta en 24-48h)
  2. Contactar abogado especializado en IP
  3. Demanda civil + posible acción criminal (si aplica)

---

## 📞 Contacto

**Dudas sobre qué publicar:** licensing@gigchain.io  
**Reportar uso no autorizado:** violations@gigchain.io (reward 10% de licencia recuperada)  
**Contribuciones:** Firmar CLA en primer PR automáticamente

---

*Documento confidencial - Solo para equipo de desarrollo de GigChain.io*  
*Última actualización: 6 Octubre 2025*
