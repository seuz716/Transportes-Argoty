# Mejoras Implementadas — FLOTA YC

> **Fecha**: 2026-07-29  
> **Estado**: Implementadas Mejoras 1-10 (v0.3.0)

---

## ✅ Mejora 1: Checkbox para gastos adicionales

### Archivos modificados:
1. `src/index.html`
2. `src/api.js`
3. `src/datos/pdf.js`

### Cambios específicos:

#### 1.1. UI - Formulario de gasto (index.html, líneas 152-161)
- ✅ Agregado checkbox `gasto-adicional` con etiqueta explicativa
- ✅ Agregado display `dia-display` para mostrar el día de la semana
- ✅ CSS apropiado para el display del día

#### 1.2. Lógica de agregación de gastos (index.html, líneas 573-601)
- ✅ Validación: si es adicional, la fecha es opcional
- ✅ Si no es adicional, la fecha es obligatoria
- ✅ Al agregar gasto adicional, se reinicia el checkbox
- ✅ Se pasa el parámetro `esAdicional` al backend

#### 1.3. Manejadores de eventos (index.html, líneas 859-885)
- ✅ Checkbox muestra/oculta el campo de fecha
- ✅ Al marcar adicional, se limpia la fecha
- ✅ Al desmarcar, se muestra el día de la semana

#### 1.4. Función updateDiaDisplay() (index.html, líneas 792-805)
- ✅ Muestra el día de la semana seleccionado
- ✅ Se ejecuta al cambiar la fecha o al iniciar

#### 1.5. Renderizado de gastos (index.html, líneas 646-677)
- ✅ Badge azul "Adic." para gastos adicionales
- ✅ Muestra "Sin día específico" cuando diaSemana está vacío
- ✅ Confirmación al editar sobre si es adicional

#### 1.6. Backend - agregarGasto y editarGasto (api.js, líneas 208-251)
- ✅ Manejo de fecha vacía para gastos adicionales
- ✅ Manejo seguro de parsing de fecha con try/catch
- ✅ Validación de esAdicional con || false

#### 1.7. Resumen - Cálculo de totales (api.js, líneas 62-95)
- ✅ Exclusión de gastos adicionales del cálculo de totalPorDia
- ✅ Validación de diaSemana antes de agregar al set

#### 1.8. PDF - Generación (pdf.js, líneas 29-33 y 54-64)
- ✅ Solo agrega a dias cuando tiene diaSemana
- ✅ Subtotal de gastos adicionales en PDF
- ✅ Separación clara entre "Gastos por día" y "Gastos adicionales"

---

## ✅ Mejora 2: Cola offline refactorizada

### Archivo modificado: `src/index.html` (líneas 288-397)

### Problemas corregidos:

#### 2.1. forEach + splice durante iteración ❌ → ✅
**Antes:**
```javascript
queue.forEach(function(op, idx) {
  GAS.call(op.fn, op.args).then(function() {
    queue.splice(idx, 1);  // SALTA ELEMENTOS
  });
});
```

**Después:**
```javascript
var originalQueue = queue.slice(); // Copia
originalQueue.forEach(function(op, idx) {
  GAS.call(op.fn, op.args).then(function() {
    _gasRemoveOperation(op.fn, op.args);  // Elimina seguro
  });
});
```

#### 2.2. Operaciones fallidas no se reintentan ❌ → ✅
- ✅ Se agregó contador de reintentos (`retries`)
- ✅ Límite máximo de reintentos: `GAS_MAX_RETRIES = 3`
- ✅ Operaciones fallidas se mantienen en cola con contador actualizado

#### 2.3. Contador procesado en fallo ❌ → ✅
```javascript
// Antes: incrementaba pero no eliminaba
processed++;  // Fallo

// Ahora: maneja fallos separadamente
} catch(function(error) {
  _gasIncrementRetry(op);  // Maneja retry
  processed++;
})
```

#### 2.4. Nuevas funciones agregadas:
- `_gasRemoveOperation(fn, args)` - Elimina operación de forma segura
- `_gasIncrementRetry(op)` - Maneja lógica de reintentos
- `GAS_MAX_RETRIES` - Constante para límite de reintentos

#### 2.5. Prevención de duplicados
```javascript
var existingIndex = queue.findIndex(function(op) {
  // Comparar sin el token (último argumento)
  var argsToCompare = op.args.length > 0 ? op.args.slice(0, -1) : [];
  var providedArgs = args.slice(0, -1);
  return op.fn === fn && JSON.stringify(argsToCompare) === JSON.stringify(providedArgs);
});
if (existingIndex > -1) {
  // Actualizar operación existente
  queue[existingIndex].args = args;
}
```

---

## 📋 Mejoras Implementadas en v0.3.0

### ✅ Mejora 3: Acceso al Web App consistente
- Ya estaba en `MYSELF` — solo se verificó documentación
- `DEPLOY.md` y `appsscript.json` consistentes

### ✅ Mejora 4: Contador de pendientes
- CSS actualizado: `font-size:1rem`, `font-weight:700`, fondo semitransparente
- Tooltip con descripción

### ✅ Mejora 7: Categoría al convertir bitácora a gasto
- Prompt con lista de categorías antes de convertir
- Parámetro `categoria` enviado al backend
- Backend usa `categoria || "Otro"`

### ✅ Mejora 8: Conductor en PDF
- Nuevo campo opcional "Conductor" al crear viaje
- Header `conductor` agregado a Liquidaciones
- PDF muestra "Vehículo: XXXX | Conductor: Nombre"

### ✅ Mejora 9: Validar km final vs km actual
- Backend: `cerrarLiquidacion` valida contra `vehiculo.kmActual`
- Frontend: `confirmarCierre` valida antes de enviar
- Nueva API `obtenerKmActualVehiculo()`

### ✅ Mejora 10: Cache backend
- Cache reducido de 30s a 10s
- Invalida cache en todas las mutaciones de gastos/fletes/bitácora
- Nueva función `_invalidarCacheResumen()`

### 🐛 Bug C1: `editarFila` corrompía datos
- **Crítico**: escribía valores desde columna 1 sin mapear headers
- **Fix**: lee fila completa, mergea cambios por header key, escribe completo

---

## 🧪 Verificación

### Funcionalidad probada:
- [x] Checkbox "Gasto adicional" visible en formulario
- [x] Al marcar adicional, el campo de fecha se oculta
- [x] Al agregar gasto adicional, se guarda correctamente con fecha vacía
- [x] Gastos adicionales se muestran con badge en la lista
- [x] PDF muestra sección separada "Gastos adicionales"
- [x] Al editar gasto, se pregunta si es adicional
- [x] Cola offline procesa operaciones sin saltarse elementos
- [x] Operaciones fallidas se reintentan hasta 3 veces
- [x] Contador de pendientes muestra tooltip

### Archivos modificados:
```
src/index.html   (UI + lógica de gastos + cola offline)
src/api.js       (backend gastos)
src/datos/pdf.js (generación PDF)
```

---

## 📝 Notas para despliegue

1. Ejecutar `npm run push` con **clasp**
2. Verificar que `appsscript.json` tenga el acceso correcto
3. Probar en modo simulación:
   - Crear gasto normal (con día)
   - Crear gasto adicional (sin día)
   - Verificar en lista y PDF
4. Probar modo offline:
   - Desconectar internet temporalmente
   - Realizar operaciones (gasto, flete)
   - Verificar que aparecen en cola
   - Reconectar y verificar que se sincronizan
5. Limpiar cache de navegador si es necesario