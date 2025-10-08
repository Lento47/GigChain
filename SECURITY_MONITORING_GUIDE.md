# 🛡️ GigChain Security Monitoring Guide - SIEM + AI

**Tu Pregunta:** *"¿Enviar datos a Splunk/Elastic? ¿O crear IA propia para detectar anomalías?"*

**Respuesta:** **AMBAS** - Son complementarias, no excluyentes. ✨

---

## 📋 Tabla de Contenidos

1. [SIEM vs IA: ¿Qué Usar?](#siem-vs-ia-qué-usar)
2. [¿Qué Implementé?](#qué-implementé)
3. [SIEMs Soportados](#siems-soportados)
4. [IA de Detección de Anomalías](#ia-de-detección-de-anomalías)
5. [Configuración](#configuración)
6. [Casos de Uso](#casos-de-uso)
7. [Costos](#costos)

---

## 🎯 SIEM vs IA: ¿Qué Usar?

### Opción 1: SIEM (Splunk, Elastic, Datadog)

**¿Qué es un SIEM?**
```
SIEM = Security Information and Event Management
```

**✅ Ventajas:**
- ✅ **Industry Standard** - Compliance (SOC 2, ISO 27001, HIPAA)
- ✅ **Auditoría completa** - Required para inversores/clientes enterprise
- ✅ **Correlación de eventos** - Ve patrones en múltiples sistemas
- ✅ **Retención larga** - Guarda logs 90 días-2 años
- ✅ **Dashboard potentes** - Visualizaciones profesionales
- ✅ **Alertas configurables** - Email, Slack, PagerDuty
- ✅ **Forense** - Investigación post-incidente

**❌ Desventajas:**
- ❌ **Costo** - $50-500/mes (según volumen)
- ❌ **Genérico** - No conoce patrones específicos de GigChain
- ❌ **Setup complejo** - Requiere configuración
- ❌ **Latencia** - Alertas pueden tardar minutos

### Opción 2: IA Propia (Ya Implementada)

**¿Qué hace?**
```
Aprende el comportamiento normal de tus usuarios
y detecta anomalías en tiempo real
```

**✅ Ventajas:**
- ✅ **Específico para GigChain** - Entiende contratos, wallets, pagos
- ✅ **Tiempo real** - Detecta anomalías instantáneamente
- ✅ **Sin costo** - Incluido, corre en tu servidor
- ✅ **Aprende automáticamente** - Se adapta a tus usuarios
- ✅ **Prevención activa** - Puede bloquear automáticamente
- ✅ **Privacidad** - Datos no salen de tu servidor

**❌ Desventajas:**
- ❌ **No es compliance** - No reemplaza SIEM para auditorías
- ❌ **Learning period** - Necesita datos para aprender
- ❌ **Sin retención larga** - Solo últimos 1,000 eventos en RAM

---

## 💡 Recomendación: **USA AMBAS**

```
┌─────────────────────────────────────────┐
│   Tu Aplicación (FastAPI)              │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │  Security Monitoring System     │  │
│   └──────────┬──────────────────────┘  │
│              │                          │
│              ├──────────┬───────────┐   │
│              ▼          ▼           ▼   │
│         ┌────────┐ ┌────────┐ ┌────────┐
│         │   IA   │ │Splunk │ │Elastic│
│         │Anomalía│ │ (SIEM)│ │(SIEM) │
│         └────────┘ └────────┘ └────────┘
│              │          │          │     
│              ▼          ▼          ▼     
│         Real-time  Compliance  Analytics
│         Blocking   Auditing    Dashboard
└─────────────────────────────────────────┘

IA = Detección inmediata + prevención
SIEM = Compliance + auditoría + retención
```

---

## ✅ ¿Qué Implementé?

### 1. Sistema de Logging Estructurado

```python
# Cada evento de seguridad tiene:
{
  "timestamp": "2025-10-08T12:00:00",
  "event_id": "abc123...",
  "category": "authentication",  # authentication, payment, contract, etc.
  "severity": "warning",         # info, warning, error, critical, security
  "user_id": "user_123",
  "wallet_address": "0x742d...",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "action": "login",
  "result": "success",           # success, failure, blocked
  "risk_score": 15.5,            # 0-100 (calculado por IA)
  "details": {
    "ai_analysis": {
      "is_anomaly": false,
      "reasons": [],
      "recommendations": []
    }
  }
}
```

### 2. Adaptadores para SIEMs

**Splunk:**
- HTTP Event Collector (HEC)
- JSON format
- Auto-indexing

**Elasticsearch:**
- REST API
- JSON documents
- Kibana dashboards

**Datadog:**
- Logs API
- Tags automáticos
- APM integration

### 3. IA de Detección de Anomalías

**Detecta:**
- ✅ Logins a horas inusuales (2-5 AM)
- ✅ Viaje imposible (IP cambia de país en minutos)
- ✅ Brute force (múltiples fallos de login)
- ✅ Transacciones anómalas (10x el promedio del usuario)
- ✅ Velocidad sospechosa (muchas acciones en segundos)
- ✅ API abuse (100+ llamadas en 1 minuto)
- ✅ Nuevo usuario actividad sospechosa (transacción grande inmediata)

**Aprende:**
- Patrón normal de cada usuario
- Horarios típicos de login
- IPs habituales
- Montos típicos de contratos
- Velocidad normal de uso

### 4. API Endpoints (6 nuevos)

```
GET  /api/admin/security/events          - Ver eventos recientes
GET  /api/admin/security/stats           - Estadísticas de seguridad
GET  /api/admin/security/high-risk       - Eventos de alto riesgo
GET  /api/admin/security/user-profile/{id} - Perfil de seguridad de usuario
GET  /api/admin/security/siem-status     - Estado de integraciones SIEM
POST /api/admin/security/test-alert      - Probar alertas (Super Admin)
```

---

## 🔧 SIEMs Soportados

### 1. Splunk

**¿Cuándo usar?**
- Empresas grandes
- Compliance SOC 2 / ISO 27001
- Necesitas retención > 1 año
- Ya usan Splunk

**Configuración:**

```bash
# 1. Crear HTTP Event Collector en Splunk
# Splunk UI → Settings → Data Inputs → HTTP Event Collector → New Token

# 2. Obtener URL y Token
SPLUNK_HEC_URL=https://splunk.example.com:8088/services/collector
SPLUNK_HEC_TOKEN=12345678-1234-1234-1234-123456789012

# 3. Agregar a .env
echo "SPLUNK_HEC_URL=$SPLUNK_HEC_URL" >> .env
echo "SPLUNK_HEC_TOKEN=$SPLUNK_HEC_TOKEN" >> .env

# 4. Reiniciar aplicación
python3 main.py

# ✅ Listo! Eventos se envían automáticamente
```

**Splunk Query Examples:**

```spl
# Ver todos los eventos de GigChain
index=main source="gigchain" 

# Eventos de alto riesgo
index=main source="gigchain" risk_score>50

# Failed logins
index=main source="gigchain" category="authentication" result="failure"

# Pagos grandes
index=main source="gigchain" category="payment" details.amount>10000
```

**Costos:**
- Splunk Cloud: $150/mes (5 GB/day)
- Splunk Enterprise: $2,000+ (self-hosted)
- Splunk Free: 500 MB/day (gratis pero limitado)

---

### 2. Elasticsearch + Kibana

**¿Cuándo usar?**
- Open source preferido
- Quieres control total
- Necesitas búsquedas rápidas
- Self-hosted o Elastic Cloud

**Configuración:**

```bash
# Opción A: Elastic Cloud (recomendado)
# 1. Crear cuenta en elastic.co
# 2. Crear deployment
# 3. Obtener API key

ELASTIC_URL=https://abc123.es.io:9243
ELASTIC_INDEX=gigchain-security
ELASTIC_API_KEY=your_api_key_here

# Opción B: Self-hosted
docker run -d -p 9200:9200 -p 5601:5601 \
  -e "discovery.type=single-node" \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0

ELASTIC_URL=http://localhost:9200
ELASTIC_INDEX=gigchain-security
# Username/password auth:
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your_password

# Agregar a .env
echo "ELASTIC_URL=$ELASTIC_URL" >> .env
echo "ELASTIC_INDEX=$ELASTIC_INDEX" >> .env
echo "ELASTIC_API_KEY=$ELASTIC_API_KEY" >> .env

# Reiniciar
python3 main.py

# ✅ Listo!
```

**Kibana Dashboard Setup:**

```bash
# 1. Ir a Kibana (http://localhost:5601)

# 2. Create Index Pattern
Management → Index Patterns → Create
Pattern: gigchain-security-*
Time field: @timestamp

# 3. Create Visualizations
- Pie chart: Events by category
- Line chart: Risk score over time
- Table: High-risk events
- Heatmap: Login times

# 4. Create Dashboard
Dashboard → Create → Add visualizations
```

**Costos:**
- Elastic Cloud: $95/mes (2 GB RAM, 8 GB storage)
- Self-hosted: $0 (open source)
- Enterprise: $125+/mes (ML, alerting)

---

### 3. Datadog

**¿Cuándo usar?**
- Ya usas Datadog APM/Infrastructure
- Quieres integración completa
- Dashboard moderno y fácil
- Startup/scaleup

**Configuración:**

```bash
# 1. Obtener API key de Datadog
# Datadog UI → Organization Settings → API Keys

DATADOG_API_KEY=your_32_char_api_key_here
DATADOG_SITE=datadoghq.com  # o datadoghq.eu

# 2. Agregar a .env
echo "DATADOG_API_KEY=$DATADOG_API_KEY" >> .env
echo "DATADOG_SITE=$DATADOG_SITE" >> .env

# 3. Reiniciar
python3 main.py

# ✅ Listo!
```

**Datadog Query Examples:**

```
# Ver eventos GigChain
source:gigchain

# Alto riesgo
source:gigchain @details.risk_score:>50

# Por categoría
source:gigchain @category:authentication

# Failed logins
source:gigchain @result:failure @category:authentication
```

**Costos:**
- Logs: $0.10 per GB ingested
- ~1,000 usuarios = ~5 GB/mes = $0.50/mes
- ~10,000 usuarios = ~50 GB/mes = $5/mes
- Plus retention: +$0.05/GB/mes

---

## 🤖 IA de Detección de Anomalías

### Cómo Funciona

```
┌──────────────────────────────────────────┐
│  Usuario hace login                      │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Security Monitoring captura evento      │
│  {user_id, ip, time, action}             │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  IA Anomaly Detector analiza:            │
│  • Compara con patrón del usuario        │
│  • Compara con promedio global           │
│  • Busca 7 tipos de anomalías            │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Calcula Risk Score (0-100)              │
│  • Time anomaly: +15 pts                 │
│  • Location anomaly: +20 pts             │
│  • Velocity anomaly: +25 pts             │
│  • Amount anomaly: +30 pts               │
│  • Login anomaly: +35 pts                │
│  • API abuse: +20 pts                    │
│  • New user suspicious: +25 pts          │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Risk Score > 70? → BLOCK + ALERT        │
│  Risk Score 50-70? → ALERT TEAM          │
│  Risk Score 30-50? → MONITOR             │
│  Risk Score < 30? → ALLOW                │
└──────────────────────────────────────────┘
```

### Ejemplos de Detección

#### Ejemplo 1: Brute Force Attack

```
Usuario: 0x742d...
10:00:00 - Login failed (wrong password)
10:00:05 - Login failed (wrong password)
10:00:10 - Login failed (wrong password)
10:00:15 - Login failed (wrong password)
10:00:20 - Login failed (wrong password)

┌─────────────────────────────────────────┐
│ 🚨 ANOMALY DETECTED                     │
├─────────────────────────────────────────┤
│ Risk Score: 85/100                      │
│ Reason: Multiple failed logins (5 in 20s)│
│ Recommendation: 🔴 BLOCK USER           │
└─────────────────────────────────────────┘
```

#### Ejemplo 2: Impossible Travel

```
Usuario: user_123
10:00:00 - Login from USA (IP: 192.168.1.1)
10:05:00 - Login from China (IP: 123.45.67.89)

┌─────────────────────────────────────────┐
│ 🚨 ANOMALY DETECTED                     │
├─────────────────────────────────────────┤
│ Risk Score: 75/100                      │
│ Reason: Location change: 4 IPs in 5 min │
│ Recommendation: ⚠️  REQUIRE 2FA         │
└─────────────────────────────────────────┘
```

#### Ejemplo 3: Suspicious New User

```
Usuario: new_user_456 (created 10 minutes ago)
Action: Create contract for $50,000

┌─────────────────────────────────────────┐
│ 🚨 ANOMALY DETECTED                     │
├─────────────────────────────────────────┤
│ Risk Score: 65/100                      │
│ Reason: New user large transaction      │
│ Recommendation: 📧 NOTIFY SECURITY TEAM │
└─────────────────────────────────────────┘
```

---

## 🎯 Casos de Uso

### Caso 1: Compliance para Inversionistas

**Problema:** Inversionista Serie A pregunta "¿Tienen auditoría de seguridad?"

**Solución:**
```bash
# Configurar Splunk/Elastic
SPLUNK_HEC_URL=... >> .env
SPLUNK_HEC_TOKEN=... >> .env

# Mostrar dashboard
"Sí, todos los eventos van a Splunk con retención 1 año"
```

### Caso 2: Fraude Detectado

**Problema:** Usuario robó wallet de otro y está intentando sacar fondos

**Solución:**
```
1. IA detecta:
   - Login desde IP nueva
   - Transacción 10x más grande que promedio
   - Velocidad: acción inmediata tras login

2. Risk Score: 95/100

3. Acción automática: BLOQUEAR

4. Alert enviado a: Splunk + Admin + Email

5. Admin investiga en dashboard
```

### Caso 3: API Abuse

**Problema:** Bot está haciendo 10,000 requests/min

**Solución:**
```
1. IA detecta: 100 API calls en 60 segundos

2. Risk Score: 85/100

3. Acción: BLOCK IP + ALERT

4. Event logged en SIEM para análisis
```

---

## 💰 Costos

### Comparación

| Solución | Setup | Mensual | Usuarios | Mejor Para |
|----------|-------|---------|----------|------------|
| **Solo IA** | ✅ Gratis | $0 | Ilimitado | Startups, MVP |
| **IA + Splunk Free** | 2 hrs | $0 | <5,000 | Small business |
| **IA + Elastic Cloud** | 1 hr | $95 | <50,000 | Growing startup |
| **IA + Datadog** | 30 min | $5-50 | <100,000 | Modern stack |
| **IA + Splunk Enterprise** | 1 día | $150-500 | Ilimitado | Enterprise |

### Mi Recomendación por Etapa

```
Etapa 1 (0-1,000 usuarios):
├── ✅ Solo IA (gratis)
└── 📊 Monitorear con dashboards internos

Etapa 2 (1,000-10,000 usuarios):
├── ✅ IA + Datadog ($5-20/mes)
└── 📊 Dashboards profesionales + alertas

Etapa 3 (10,000-100,000 usuarios):
├── ✅ IA + Elastic Cloud ($95/mes)
└── 📊 Self-hosted, control total

Etapa 4 (100,000+ usuarios):
├── ✅ IA + Splunk Enterprise ($500+/mes)
└── 📊 Enterprise compliance, SOC 2
```

---

## 🚀 Quick Start

### Opción 1: Solo IA (Gratis - Ya funciona)

```bash
# ¡Ya está funcionando!
# La IA detecta anomalías automáticamente

# Ver eventos
curl http://localhost:5000/api/admin/security/events \
  -H "Authorization: Bearer YOUR_TOKEN"

# Ver high-risk
curl http://localhost:5000/api/admin/security/high-risk \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Opción 2: IA + Datadog (Recomendado - 5 minutos)

```bash
# 1. Crear cuenta en datadog.com (14 días gratis)

# 2. Obtener API key (UI → Organization Settings → API Keys)

# 3. Agregar a .env
echo "DATADOG_API_KEY=your_key_here" >> .env

# 4. Reiniciar
python3 main.py

# ✅ Eventos se envían automáticamente a Datadog
```

### Opción 3: IA + Elastic (Self-hosted - 10 minutos)

```bash
# 1. Iniciar Elasticsearch
docker run -d -p 9200:9200 -p 5601:5601 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0

# 2. Configurar
echo "ELASTIC_URL=http://localhost:9200" >> .env
echo "ELASTIC_INDEX=gigchain-security" >> .env

# 3. Reiniciar
python3 main.py

# 4. Ver en Kibana
# http://localhost:5601
```

---

## 📊 Dashboard Example

**Kibana Visualization:**

```
╔══════════════════════════════════════════════╗
║         GigChain Security Dashboard          ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Total Events Today: 1,523                   ║
║  High Risk Events: 12                        ║
║  Users Monitored: 87                         ║
║  Alerts Sent: 3                              ║
║                                              ║
║  ┌────────────────────────────────────────┐ ║
║  │ Risk Score Over Time                   │ ║
║  │ 100┤                              ●    │ ║
║  │  75┤     ●                             │ ║
║  │  50┤ ●●●   ●●●●●●                      │ ║
║  │  25┤           ●●●●●●●●●●●●●●●●●●●●●● │ ║
║  │   0└────────────────────────────────── │ ║
║  └────────────────────────────────────────┘ ║
║                                              ║
║  Events by Category:                         ║
║  ██████████ Authentication (45%)             ║
║  ████████ Payment (30%)                      ║
║  ████ Contract (15%)                         ║
║  ██ Admin (10%)                              ║
║                                              ║
║  Top High-Risk Users:                        ║
║  1. 0x742d... (Score: 85)                    ║
║  2. user_456  (Score: 75)                    ║
║  3. 0x1a2b... (Score: 65)                    ║
╚══════════════════════════════════════════════╝
```

---

## ✅ Resumen

**¿SIEM o IA?** → **AMBAS**

```
IA = Detección inmediata + prevención automática
SIEM = Compliance + auditoría + retención larga

Juntas = Seguridad enterprise completa
```

**Ya implementado:**
- ✅ Sistema de logging estructurado
- ✅ Adaptadores Splunk, Elastic, Datadog
- ✅ IA de detección de anomalías (7 tipos)
- ✅ 6 endpoints API de seguridad
- ✅ Alertas automáticas
- ✅ Risk scoring

**Para empezar:**
- Opción 1: Solo IA (gratis, ya funciona)
- Opción 2: IA + Datadog ($5/mes, 5 minutos)
- Opción 3: IA + Elastic (gratis self-hosted, 10 minutos)

**Cuando crezcas:**
- Añadir Splunk para compliance enterprise

---

*Última actualización: October 8, 2025*  
*Versión: 1.0.0*
