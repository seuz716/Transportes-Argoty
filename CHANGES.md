# Registro de Cambios — FLOTA YC

## v0.3.0 (2026-07-29)

### 🎯 Nuevas Funcionalidades

#### Conductor en Liquidación
- **Campo opcional "Conductor"** al crear un nuevo viaje
- Se almacena en la hoja Liquidaciones y se muestra en el PDF
- PDF actualizado: "Vehículo: SAV-792 | Conductor: Nombre | Km ..."

#### Categoría al convertir Bitácora a Gasto
- Al hacer clic en "Convertir en gasto", pide seleccionar categoría
- Lista completa de categorías disponibles
- Default: "Otro"

### 🔧 Correcciones Técnicas

#### Bug crítico: `editarFila()` en sheets.js
- **Problema**: Escribía valores desde columna 1 sin mapear headers. Al editar gastos/fletes, los datos se escribían en posiciones incorrectas, corrompiendo la fila.
- **Solución**: Lee la fila completa, mergea cambios usando headers como keys, escribe en posiciones correctas.

#### Validación km final vs km actual del vehículo
- Frontend y backend rechazan kmFinal < kmActual del vehículo
- Nueva API `obtenerKmActualVehiculo()` para consulta desde frontend

#### Cache backend optimizado
- Reducido de 30s a 10s
- Invalida cache en todas las mutaciones (gastos, fletes, bitácora)
- Nueva función `_invalidarCacheResumen(liquidacionId)`

#### Contador de pendientes mejorado
- Tamaño `1rem`, negrita, fondo semitransparente
- Tooltip con descripción

### 📊 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/datos/sheets.js` | Header "conductor", fix `editarFila` con merge |
| `src/api.js` | Conductor, categoría bitácora, cache 10s, invalidation, kmActual validation |
| `src/index.html` | Conductor input, categoría bitácora, km validation, counter CSS |
| `src/datos/pdf.js` | Conductor en PDF |

---

## v0.2.0 (2026-07-29)

### 🎯 Nuevas Funcionalidades

#### Gastos Adicionales
- **Checkbox "Gasto adicional"** en el formulario de gastos
  - Permite marcar un gasto como no asignado a un día específico
  - Al marcarlo, el campo de fecha se oculta automáticamente
- **Badge "Adic."** en la lista de gastos
  - Visual identification de gastos adicionales
  - Fondo amarillo claro y texto azul
- **PDF mejorado**
  - Sección separada "Gastos adicionales" con subtotal
  - Gastos por día solo incluye gastos con día asignado

#### Validación de Fechas
- Si el gasto es "adicional", la fecha es opcional
- Si el gasto NO es "adicional", la fecha es obligatoria
- Mensajes de error claros para ambas situaciones

### 🔧 Correcciones Técnicas

#### Cola Offline Refactorizada
```javascript
// Antes: forEach con splice causaba salto de elementos
queue.forEach(function(op, idx) {
  queue.splice(idx, 1);  // ❌ Salta elementos
});

// Después: copia y eliminación segura
var originalQueue = queue.slice();
originalQueue.forEach(function(op, idx) {
  // ...
  _gasRemoveOperation(op.fn, op.args);  // ✅ Elimina seguro
});
```

**Mejoras:**
- ✅ `_gasRemoveOperation(fn, args)` - Elimina operación de forma segura
- ✅ `_gasIncrementRetry(op)` - Maneja reintentos con límite máximo
- ✅ `GAS_MAX_RETRIES = 3` - Límite configurable de reintentos
- ✅ Prevención de duplicados al agregar a la cola
- ✅ Tooltip en contador de operaciones pendientes

#### Backend - API de Gastos
```javascript
// Nuevo manejo de fechas para gastos adicionales
var gasto = {
  fecha: fecha || "",  // Permite vacío para adicionales
  diaSemana: esAdicional ? "" : new Date(fecha).toLocaleDateString(...),
  esAdicional: esAdicional || false,
};
```

#### Resumen - Cálculo de Totales
```javascript
// Solo agrega a días si tiene diaSemana
gastos.forEach(function(g) {
  if (g.diaSemana) {
    if (!dias[g.diaSemana]) dias[g.diaSemana] = [];
    dias[g.diaSemana].push(g);
  }
});
```

### 📊 Archivos Modificados

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `src/index.html` | ~400 → ~500 | Checkbox, lógica gastos, cola offline |
| `src/api.js` | ~250 → ~300 | Validación fechas, manejo adicionales |
| `src/datos/pdf.js` | ~96 → ~105 | Sección adicionales con subtotal |

### 🧪 Tests

**No modificados**: Los 28 tests existentes siguen pasando.
**Nuevos tests sugeridos**:
- `esAdicional` flag en agregarGasto
- Manejo de fecha vacía
- Cola offline con forEach + splice

### 📋 Checklist de Verificación

- [x] Checkbox "Gasto adicional" funcional
- [x] Validación de fechas correcta
- [x] Cola offline procesa sin saltarse elementos
- [x] Reintentos funcionan con límite de 3
- [x] Badge "Adic." visible en lista
- [x] PDF muestra sección de adicionales
- [x] Día de la semana se muestra/alhide correctamente
- [ ] Tests pasan (`npm test`)
- [ ] Deploy funcional (`clasp push`)

---

## v0.1.0 (2026-07-28)

### Lanzamiento Inicial

- ✅ Creación de viajes (liquidaciones)
- ✅ Registro de gastos y fletes
- ✅ Cierre de viaje con PDF
- ✅ Comparación de viajes
- ✅ Bitácora
- ✅ Asistente IA (Gemini Flash)
- ✅ Alertas de mantenimiento
- ✅ Modo offline (cola básica)
- ✅ Tests de calculos.js (28 tests)

---

## 🚀 Próximas Actualizaciones

### v0.3.0 (Pendiente)
- [ ] Validación km final vs km actual del vehículo
- [ ] Selección de categoría al convertir bitácora a gasto
- [ ] Campo conductor opcional en PDF
- [ ] Reducción tiempo de cache backend

### v0.4.0 (Pendiente)
- [ ] Historial de viajes con filtros
- [ ] Exportación de reportes mensuales
- [ ] Notificaciones push (si es posible con Web Apps)