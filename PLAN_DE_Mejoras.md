# Plan de Mejoras — FLOTA YC

> **Fecha**: 2026-07-29  
> **Estado actual**: Implementadas Mejoras 1-10 (v0.3.0)

---

## 🔄 Tabla de Prioridades Actualizada

| # | Hallazgo | Severidad | Estado | Progreso |
|---|----------|-----------|--------|----------|
| 1 | Falta opción para marcar gastos como adicionales | Alta | ✅ **COMPLETA** | 100% |
| 2 | Cola offline defectuosa | Alta | ✅ **COMPLETA** | 100% |
| 3 | Inconsistencia en acceso al web app | Media | ✅ **COMPLETA** | 100% |
| 4 | Contador de pendientes pequeño | Baja | ✅ **COMPLETA** | 100% |
| 5 | No se muestra día de la semana al agregar gasto | Baja | ✅ **COMPLETA** | 100% |
| 6 | Gastos adicionales no distinguen en lista | Baja | ✅ **COMPLETA** | 100% |
| 7 | Conversión bitácora a gasto sin categoría | Media | ✅ **COMPLETA** | 100% |
| 8 | PDF no incluye nombre conductor/vehículo | Baja | ✅ **COMPLETA** | 100% |
| 9 | No valida km final < km actual vehículo | Media | ✅ **COMPLETA** | 100% |
| 10 | Cache de 30 segundos posible desfase | Baja | ✅ **COMPLETA** | 100% |

---

## 📌 Mejora 1: Checkbox para gastos adicionales ✅ IMPLEMENTADA

### Estado: COMPLETA

#### Archivos modificados:
1. `src/index.html` - UI del formulario
2. `src/api.js` - Función `agregarGasto` y `editarGasto`
3. `src/datos/pdf.js` - Validación y formateo

#### Cambios realizados:
- ✅ Checkbox `gasto-adicional` agregado al formulario
- ✅ Display `dia-display` muestra día de la semana seleccionado
- ✅ Validación: si es adicional, fecha es opcional
- ✅ Backend maneja fecha vacía para gastos adicionales
- ✅ Badge "Adic." en lista de gastos
- ✅ Día muestra "Sin día específico" para adicionales
- ✅ PDF separa "Gastos por día" y "Gastos adicionales"

---

## 📌 Mejora 2: Cola offline refactorizada ✅ IMPLEMENTADA

### Estado: COMPLETA

#### Correcciones aplicadas:
- ✅ **forEach + splice**: Ahora trabaja con copia del array
- ✅ **Reintentos**: Límite de 3 intentos por operación
- ✅ **Eliminación segura**: Nueva función `_gasRemoveOperation()`
- ✅ **Prevención duplicados**: Detecta y actualiza operaciones similares
- ✅ **Tooltip**: Contador muestra información adicional

#### Nuevas funciones:
```javascript
function _gasRemoveOperation(fn, args) { ... }
function _gasIncrementRetry(op) { ... }
const GAS_MAX_RETRIES = 3;
```

---

## 📌 Mejora 3: Consistentar acceso al Web App ✅ COMPLETA

### Estado: COMPLETA

`appsscript.json` ya tiene `"access": "MYSELF"` y `DEPLOY.md` lo documenta como recomendado. Sin acción requerida.

---

## 📌 Mejora 4: Mejorar visibilidad del contador ✅ COMPLETA

### Estado: COMPLETA

#### Cambios:
- ✅ Tamaño aumentado a `1rem`
- ✅ Fuente en negrita
- ✅ Fondo semitransparente con padding
- ✅ Tooltip al pasar mouse

---

## 📌 Mejora 5: Mostrar día de la semana al agregar gasto ✅ IMPLEMENTADA

### Estado: COMPLETA

#### Cambios:
- ✅ Display dinámico del día de la semana
- ✅ Se actualiza al cambiar la fecha
- ✅ Se oculta cuando se marca gasto como adicional

---

## 📌 Mejora 6: Badge para gastos adicionales ✅ IMPLEMENTADA

### Estado: COMPLETA

#### Cambios:
- ✅ Badge azul "Adic." en la lista
- ✅ Fondo amarillo claro para items adicionales

---

## 📌 Mejora 7: Categoría al convertir bitácora a gasto ✅ COMPLETA

### Estado: COMPLETA

#### Archivos modificados:
1. `src/index.html` - prompt de categoría y wrapper GAS
2. `src/api.js` - parámetro `categoria` en `convertirBitacoraAGasto`

#### Cambios:
- ✅ Prompt con lista de categorías al convertir
- ✅ Parámetro `categoria` enviado al backend
- ✅ Default "Otro" si no se especifica

---

## 📌 Mejora 8: Conductor en PDF ✅ COMPLETA

### Estado: COMPLETA

#### Archivos modificados:
1. `src/datos/sheets.js` - header "conductor" en Liquidaciones
2. `src/index.html` - campo opcional al crear viaje
3. `src/api.js` - parámetro `conductor` en `crearLiquidacion`
4. `src/datos/pdf.js` - muestra conductor en PDF

#### Cambios:
- ✅ Campo "Conductor (opcional)" en formulario de nuevo viaje
- ✅ Se almacena en la hoja Liquidaciones
- ✅ Se muestra en el PDF: "Vehículo: XXXX | Conductor: Nombre"

---

## 📌 Mejora 9: Validar km final vs km actual del vehículo ✅ COMPLETA

### Estado: COMPLETA

#### Archivos modificados:
1. `src/api.js` - validación en `cerrarLiquidacion` y nueva función `obtenerKmActualVehiculo`
2. `src/index.html` - validación en frontend antes de enviar

#### Cambios:
- ✅ Backend: rechaza kmFinal < kmActual del vehículo
- ✅ Frontend: muestra error antes de enviar
- ✅ Nueva API: `obtenerKmActualVehiculo()` para frontend

---

## 📌 Mejora 10: Cache backend ✅ COMPLETA

### Estado: COMPLETA

#### Archivo modificado: `src/api.js`

#### Cambios:
- ✅ Cache reducido de 30s a 10s
- ✅ Nueva función `_invalidarCacheResumen()` para invalidación selectiva
- ✅ Invalida cache en: `agregarGasto`, `editarGasto`, `eliminarGasto`, `agregarFlete`, `editarFlete`, `eliminarFlete`, `convertirBitacoraAGasto`

---

## 🐛 Bug Crítico Corregido (no cubierto en auditoría original)

### C1: `editarFila` escribe en columnas incorrectas ❌ → ✅

**Archivo:** `src/datos/sheets.js`

**Problema:** `editarFila()` escribía `Object.values(datos)` desde columna 1, sin mapear a la posición real de cada header. Al editar un gasto, `categoria` se escribía en col A (sobreescribiendo `id`), corrompiendo la fila.

**Solución:** Lee la fila completa, mergea los cambios usando headers como keys, y escribe la fila completa en las posiciones correctas.

---

## 📋 Próximos Pasos (v0.4.0+)

1. **Testing completo pre-deploy**:
    - Probar gastos normales y adicionales
    - Probar modo offline
    - Verificar PDF con conductor
    - Verificar edición de gastos/fletes (C1)
2. **Despliegue con `clasp push`**
3. **Futuro:**
    - Historial de viajes con filtros
    - Exportación de reportes mensuales
    - Notificaciones push (si es posible con Web Apps)