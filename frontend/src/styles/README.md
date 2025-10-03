# GigChain.io - Estructura de Estilos

Este directorio contiene todos los estilos CSS organizados por componentes y funcionalidades.

## 📁 Estructura de Archivos

```
styles/
├── index.css                 # Archivo principal que importa todos los estilos
├── README.md                # Este archivo de documentación
├── components/              # Estilos de componentes específicos
│   ├── wallet.css          # Estilos del componente Wallet
│   ├── notifications.css   # Estilos del centro de notificaciones
│   ├── buttons.css         # Estilos de botones y variantes
│   └── forms.css           # Estilos de formularios e inputs
├── dashboard/              # Estilos específicos del dashboard
│   ├── dashboard.css       # Estilos principales del dashboard
│   ├── chart.css           # Estilos del gráfico interactivo
│   └── modal.css           # Estilos de modales y overlays
├── layout/                 # Estilos de layout y estructura
│   ├── sidebar.css         # Estilos de la barra lateral
│   └── header.css          # Estilos del encabezado
└── utils/                  # Utilidades CSS
    ├── animations.css      # Animaciones y transiciones
    └── responsive.css      # Utilidades responsive y helpers
```

## 🎨 Variables CSS

Todas las variables CSS están definidas en `index.css`:

### Colores
- `--primary-color`: Color principal (#667eea)
- `--secondary-color`: Color secundario (#764ba2)
- `--success-color`: Color de éxito (#10b981)
- `--warning-color`: Color de advertencia (#f59e0b)
- `--error-color`: Color de error (#ef4444)

### Fondos
- `--bg-primary`: Fondo principal (#ffffff)
- `--bg-secondary`: Fondo secundario (#f8fafc)
- `--bg-tertiary`: Fondo terciario (#f1f5f9)

### Texto
- `--text-primary`: Texto principal (#1e293b)
- `--text-secondary`: Texto secundario (#64748b)
- `--text-muted`: Texto atenuado (#94a3b8)

## 🧩 Componentes

### Wallet (`components/wallet.css`)
- `.wallet-connected`: Contenedor principal del wallet
- `.wallet-avatar`: Avatar del usuario
- `.wallet-info`: Información del wallet
- `.wallet-details`: Panel desplegable con detalles

### Notifications (`components/notifications.css`)
- `.notification-center`: Centro de notificaciones
- `.notification-bell`: Botón del icono de notificación
- `.notification-panel`: Panel desplegable de notificaciones
- `.notification-item`: Item individual de notificación

### Buttons (`components/buttons.css`)
- `.btn-primary`: Botón primario
- `.btn-secondary`: Botón secundario
- `.btn-success`: Botón de éxito
- `.btn-danger`: Botón de peligro
- `.btn-warning`: Botón de advertencia
- `.btn-ghost`: Botón fantasma

### Forms (`components/forms.css`)
- `.form-input`: Input de formulario
- `.form-textarea`: Área de texto
- `.form-select`: Select dropdown
- `.form-checkbox`: Checkbox
- `.form-radio`: Radio button

## 📊 Dashboard

### Dashboard (`dashboard/dashboard.css`)
- `.dashboard`: Contenedor principal del dashboard
- `.metrics-grid`: Grid de métricas
- `.metric-card`: Tarjeta de métrica individual
- `.activity-section`: Sección de actividad reciente

### Chart (`dashboard/chart.css`)
- `.chart-container`: Contenedor del gráfico
- `.chart-visualization`: Visualización SVG del gráfico
- `.chart-tooltip`: Tooltip del gráfico
- `.chart-legend`: Leyenda del gráfico

### Modal (`dashboard/modal.css`)
- `.modal-overlay`: Overlay del modal
- `.jobs-modal`: Modal de trabajos disponibles
- `.job-card`: Tarjeta de trabajo individual

## 🏗️ Layout

### Sidebar (`layout/sidebar.css`)
- `.sidebar`: Barra lateral principal
- `.sidebar-header`: Encabezado del sidebar
- `.nav-section`: Sección de navegación
- `.nav-item`: Item de navegación

### Header (`layout/header.css`)
- `.content-header`: Encabezado del contenido
- `.page-title`: Título de la página
- `.search-bar`: Barra de búsqueda
- `.date-filter`: Filtro de fechas

## 🛠️ Utilidades

### Animations (`utils/animations.css`)
- `.fade-in`, `.fade-out`: Animaciones de desvanecimiento
- `.slide-in-*`: Animaciones de deslizamiento
- `.scale-in`, `.scale-out`: Animaciones de escala
- `.bounce-in`: Animación de rebote
- `.pulse`: Animación de pulso

### Responsive (`utils/responsive.css`)
- Clases de utilidad para flexbox y grid
- Clases de espaciado (margin, padding)
- Clases de tamaño (width, height)
- Clases responsive con breakpoints

## 📱 Responsive Design

Los estilos están optimizados para:
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: 480px - 768px
- **Small Mobile**: < 480px

## 🚀 Uso

Para usar los estilos, simplemente importa el archivo principal:

```javascript
import './styles/index.css';
```

Todos los estilos se cargarán automáticamente en el orden correcto.

## 🔧 Mantenimiento

- Cada componente tiene su propio archivo CSS
- Las variables globales están en `index.css`
- Los estilos responsive están en cada archivo correspondiente
- Las utilidades están separadas en `utils/`

## 📝 Notas

- Todos los estilos usan variables CSS para consistencia
- Los breakpoints responsive son consistentes en toda la aplicación
- Las animaciones son suaves y no intrusivas
- El diseño sigue principios de accesibilidad
