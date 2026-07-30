# Plan Integrado v0.6.0 — FLOTA YC

> Integración de PLAN_CORRECCION_v0.4.0 + PLAN_DISENO_v0.5.0
> Fecha: 2026-07-29

---

## ✅ Ya completado (v0.4.0+0.5.0)

| Origen | Item | Estado |
|--------|------|--------|
| Corrección P0-1 | kmActual actualizado al cerrar | ✅ |
| Corrección P0-2 | Cola offline captura errores de red | ✅ |
| Corrección P0-4 | Sesión expirada ≠ sin viaje | ✅ |
| Corrección P0-5a | Toast visible en load* + manejo {queued:true} | ✅ |
| Corrección P0-4c | Doble slice(0,-1) en _gasQueueOperation | ✅ |
| Corrección P0-5b | enviarPorEmail removido de isMutation | ✅ |

---

## 🚨 P0 — Críticos (primer)

### P0-1: Rate limiting per device ID (Corrección)
Problema: `executeAs: USER_DEPLOYING` → todas las sesiones comparten mismo email → bloqueo global por PIN fail de cualquier usuario. Fix: usar deviceId en localStorage para rate limiting.

### P0-2: Dark mode (Diseño)
Dark mode automático por hora + toggle manual en header. CSS variables para tema.

## 🟠 P0.5 — Ergonomía inmediata

### P0.5-1: Targets táctiles 44×44px
Botones editar/eliminar en gastos y fletes.

### P0.5-2: Loading no bloqueante
Overlay `inset:0` solo para operaciones pesadas. Spinner inline en botón para agregar gasto/flete.

### P0.5-3: Contraste texto secundario
`#9aa0a6` → variable `--text-muted` con ratio ≥ 4.5:1.

### P0.5-4: Badge pendiente offline
Indicador visual "⏳ pendiente de sync" para operaciones en cola.

## 🎨 P1 — Sistema de diseño

### P1-1: Paleta Argoty (no Google default)
Verde arveja + terracota tambor + fondo papel reciclado.

### P1-2: Tipografía con jerarquía
Display con carácter (Fraunces) + body utilitaria. Balance como héroe tipográfico.

### P1-3: Iconos propios
SVG inline, trazo consistente, 12 categorías.

## ✨ P2 — Sensación / farandulismo

### P2-1: Balance hero animado
Conteo tipo taxímetro, color variable, escala destacada.

### P2-2: Celebración al cerrar viaje
Checkmark animado + resumen visual.

### P2-3: Vibración táctil
`navigator.vibrate()` en confirmaciones.

### P2-4: Transición suave entre tabs
Slide/fade en vez de `display:none/block`.

## ✅ P3 — Accesibilidad

### P3-1: prefers-reduced-motion respetado
### P3-2: Focus visible en todos los elementos interactivos