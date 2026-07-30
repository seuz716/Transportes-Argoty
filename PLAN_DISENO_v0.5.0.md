# Plan de Diseño y Ergonomía v0.5.0 — FLOTA YC

> **Fecha**: 2026-07-29  
> **Objetivo**: Transformar de "app genérica" a "app con identidad de Argoty/Nariño"  
> **Enfoque**: Praktisch zuerst, Design System danach

---

## 🎯 Visión de Diseño

**Identidad Argoty**: Una app que sienta "viaje de arveja", con ese toque de carretera, noche, carga y clima andino.

**Paleta conceptual**:
- **Verde carga/arveja** (#388E3C o similar) - categoría principal
- **Terracota/tambor óxido** (#795548 o similar) - acento cálido
- **Gris carretera** (#616161) - neutral, profesional
- **Blanco/negro** - para contraste y legibilidad
- **Azul frío** (#1976D2) - SOLO para interactivos primarios

---

## 🚨 P0 — ERGONOMÍA URGENTE (ANTES DE OTROS CAMBIOS)

### P0-1: Modo Oscuro Automático

**Problema**: Fondo claro `f0f2f5` fatiga visual nocturna

**Solución**:
```css
/* CSS variables para tema */
:root {
  --bg-primary: #f0f2f5;
  --text-primary: #1a1a2e;
  --bg-card: #fff;
}

[data-theme="dark"], .dark-mode {
  --bg-primary: #121212;
  --text-primary: #e0e0e0;
  --bg-card: #1e1e1e;
}

/* Detectar preferencia o usar hora manual */
@media (prefers-color-scheme: dark) {
  :root { /* aplicar dark por defecto */ }
}
```

**Implementación**:
1. Agregar toggle en header o detectar automáticamente
2. Aplicar clase `dark-mode` al `<body>`
3. Reemplazar todos los colores hardcodeados por variables

**Tiempo**: 2-3 horas

---

### P0-2: Targets Táctiles Grandes

**Problema**: Editar/Eliminar `padding:4px 8px`, emoji `0.75rem` — demasiado pequeño

**Solución**:
```css
.expense-item button {
  padding: 8px 12px !important;  /* Mínimo 44×44px con padding + border */
  font-size: 1rem !important;
  min-width: 44px;
  min-height: 44px;
}

/* Espaciado entre botones */
.expense-item .amt + .btn {
  margin-left: 4px;
}
```

**Tiempo**: 30 minutos

---

### P0-3: Loading No Bloqueante

**Problema**: Overlay total `inset:0` bloquea toda pantalla

**Solución**:
```html
<!-- Spinner inline en botón, no overlay -->
<button id="btn-agregar-gasto" class="btn btn-primary loading-inline">
  <span class="btn-text">Agregar gasto</span>
  <span class="spinner-inline hidden"></span>
</button>
```

```css
.spinner-inline {
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-left: 8px;
}

.loading-inline .spinner-inline { display: inline-block; }
.loading-inline .btn-text { opacity: 0.7; }
```

**Tiempo**: 1 hora

---

### P0-4: Contraste Texto Secundario

**Problema**: `#9aa0a6` sobre blanco casi ilegible

**Solución**:
```css
:root {
  --text-secondary: #5f6368;  /* Google gris oscuro */
  --text-tertiary: #757575;   /* Más oscuro que antes */
}

.cat, .desc, .date { color: var(--text-secondary); }
```

**Tiempo**: 15 minutos

---

## 🎨 P1 — Sistema de Diseño (CSS Variables + Tokens)

### 1.1. Paleta de Color — NO Google Default

```css
:root {
  /* Colores principales Argoty */
  --color-argoty-green: #388E3C;    /* Arveja/carga */
  --color-argoty-terracotta: #795548; /* Óxido tambor */
  --color-argoty-road: #616161;     /* Gris carretera */
  
  /* Neutros */
  --color-bg-primary: #f5f5f5;
  --color-bg-card: #ffffff;
  --color-bg-dark: #121212;
  
  /* Texto */
  --color-text-primary: #212121;
  --color-text-secondary: #5f6368;
  --color-text-on-dark: #e0e0e0;
  
  /* Estados */
  --color-success: #4CAF50;
  --color-error: #f44336;
  --color-warning: #FF9800;
  --color-info: #2196F3;
  
  /* Fondo dark opcional */
  --color-bg-card-dark: #1e1e1e;
}

/* Modo oscuro */
[data-theme="dark"] {
  --color-bg-primary: #121212;
  --color-bg-card: #1e1e1e;
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #b0b0b0;
}
```

---

### 1.2. Tipografía con Jerarquía

```css
:root {
  --font-display: #\''Montserrat'\'', #\'Arial\', sans-serif;
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
  
  --font-display-bold: 1.5rem;
  --font-heading: 1.1rem;
  --font-body: 1rem;
  --font-label: 0.85rem;
  --font-small: 0.75rem;
}
```

**Aplicar al balance**:
```css
#sticky-balance .balance-value {
  font-size: 1.8rem;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--color-argoty-green);
}

#sticky-balance .balance-value.negative {
  color: var(--color-error);
}

/* Animación de conteo */
.balance-animated {
  animation: count-up 0.8s ease-out;
}
@keyframes count-up {
  from { transform: scale(0.8); }
  to { transform: scale(1); }
}
```

---

### 1.3. Sistema de Iconos Propio

**Propuesta**: Crear un set de 12 iconos consistentes con trazo de 2px:

| Categoría | Icono propuesto |
|-----------|-----------------|
| Diario | ⏰ (reloj) |
| ACPM | ⛽ (combustible) |
| Peajes | 🚧 (obra) |
| Comision | 📊 (gráfico) |
| Coteros | 👥 (personas) |
| Descargue | 📦 (caja) |
| Envarillada | 🥤 (lata) |
| Manifiesto | 📄 (documento) |
| Mantenimiento | 🔧 (llave inglesa) |
| Otro | 📌 (clavito) |

**Implementación**: SVG inline o usar una librería ligera como [Material Icons](https://fonts.google.com/icons) con selección personalizada.

---

## 🎯 P2 — SENSACIÓN "Farandulismo"

### P2-1: Balance como héroe

```html
<div id="balance-hero" class="hidden">
  <div class="balance-display">
    <span class="balance-value" id="balance-value">$0</span>
    <span class="balance-label">Balance del día</span>
  </div>
  <div class="balance-icon">🧮</div>
</div>
```

```css
#balance-hero {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, var(--color-argoty-green), var(--color-argoty-terracotta));
  border-radius: 12px;
  color: white;
  margin-bottom: 12px;
}

.balance-value {
  font-size: 2.5rem;
  font-weight: 800;
  font-family: var(--font-display);
}
```

---

### P2-2: Momento de cierre de viaje

Al cerrar, en vez de `cerramiento-result` gris plano:

```html
<div id="cierre-exitoso" class="hidden">
  <div class="cierre-animation">
    <div class="checkmark">✓</div>
    <h2>¡Viaje cerrado!</h2>
    <p class="balance-final">Balance: <span class="balance-amount">$0</span></p>
  </div>
</div>
```

```css
.cierre-animation {
  text-align: center;
  padding: 40px 20px;
  animation: fadeInUp 0.5s ease-out;
}

.checkmark {
  width: 80px;
  height: 80px;
  background: var(--color-success);
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  animation: pop 0.3s ease-out;
}

@keyframes pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

---

### P2-3: Vibración táctil

```javascript
function confirmarAccion() {
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50]);  // Patrón: 50ms ON, 30ms OFF, 50ms ON
  }
}

// Llamar después de agregar gasto, cerrar viaje, etc.
```

---

## 📋 Cronograma de Implementación

### Sprint 1: P0 - Ergonomía (2-3 horas)
1. ✅ Modo oscuro automático (con toggle opcional)
2. ✅ Targets táctiles grandes (44×44px mínimo)
3. ✅ Loading inline no bloqueante
4. ✅ Corregir contraste texto secundario

### Sprint 2: P1 - Sistema de Diseño (2-3 horas)
5. ✅ Definir y aplicar paleta de color Argoty
6. ✅ Jerarquía tipográfica (balance destacado)
7. ✅ Sistema de iconos (o librería ligera)

### Sprint 3: P2 - Sensación (1-2 horas)
8. ✅ Balance como hero con animación
9. ✅ Micro-animación cierre de viaje
10. ✅ Vibración táctil en confirmaciones

---

## 🎨 Mockup Visual (descripción)

```
┌─────────────────────────────────────┐
│ 🚛 FLOTA YC              ☀/🌙 [T] │
├─────────────────────────────────────┤
│                                     │
│    ████████████████████             │
│    ██  BALANCE: +$25.000  ██        │
│    ████████████████████             │
│                                     │
│  Vehículo: SAV-792  km 45.200      │
│                                     │
│  ┌─────────────┬─────────────┐     │
│  │ ⛽ ACPM    │ 💰 Fletes   │     │
│  │ $125.000  │ $1.000.000 │     │
│  └─────────────┴─────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Criterios de Aceptación

- [ ] Modo oscuro automático o toggle visible
- [ ] Botones editar/eliminar ≥ 44×44px
- [ ] Loading inline (no overlay para operaciones simples)
- [ ] Texto secundario legible en sol directo
- [ ] Balance con fuente grande y color destacado
- [ ] Primera carga muestra identidad visual (no app genérica)
- [ ] Al cerrar viaje: micro-animación de celebración
- [ ] Vibración al confirmar gasto/cierre

---

## 📝 Notas Técnicas

1. **No usar framework adicional** — mantener peso bajo para uso offline
2. **CSS Variables** para tema oscuro
3. **SVG inline** para iconos — 1KB total máximo
4. **Vibración opcional** — fallback si no soporta

---

> ✅ **Estado**: PLAN APROBADO PARA IMPLEMENTACIÓN