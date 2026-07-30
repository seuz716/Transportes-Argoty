# Plan de Corrección v0.4.0 — FLOTA YC

> **Fecha**: 2026-07-29  
> **Autor**: Auditoría Severa - Bugs Críticos Confirmados  
> **Estado**: PLAN DE ACCIÓN

---

## 🚨 Resumen Ejecutivo

| Prioridad | Bug | Impacto | Estado |
|-----------|-----|---------|--------|
| P0 | kmActual nunca se actualiza | Media/Window data, alertas roto | ⚠️ CRÍTICO |
| P0 | Cola offline no captura errores de red | Pérdida de datos en carretera | ⚠️ CRÍTICO |
| P0 | Rate limiting global = DoS por distribuidor | App bloqueada por terceros | ⚠️ CRÍTICO |
| P0 | Sesión expirada confundida con "sin viaje" | Duplicación de viajes | ⚠️ CRÍTICO |
| P0 | Gastos offline invisibles al usuario | Duplicación de gastos | ⚠️ CRÍTICO |
| P1 | Errores silenciados en UI | UX pobre, confusión | ⚠️ ALTO |

---

## 🔴 P0 — CORRECCIONES BLOQUEANTES

### P0-1: Vehicle kmActual nunca se actualiza

**Problema confirmado**:
```javascript
// En sheets.js - setup.js solo inicializa con kmActual: 0
// En api.js - kmActual solo se LEER, nunca escribe
vehicle.kmActual: 0,  // Solo en setup
```

**Impacto**:
- `detectarAlertasMantenimiento()` usa datos desactualizados
- Validación de `kmFinal` vs `kmActual` irrelevante

**Solución requerida**:
```javascript
// En cerrarLiquidacion() - después de calcular todo
function actualizarVehiculo(liquidacion) {
  var hoja = obtenerHoja("Vehiculo");
  var filas = leerFilas(hoja, 2);
  var idx = filas.findIndex(f => String(f.placa) === String(liquidacion.placa));
  if (idx !== -1) {
    filas[idx].kmActual = liquidacion.kmFinal;
    // Opcional: actualizar fechas de mantenimiento si corresponde
    escribirFilas(hoja, filas, 2);
  }
}
```

**Archivos impactados**:
- `src/api.js` - función `cerrarLiquidacion()`
- `src/datos/sheets.js` - posible función helper

**Tiempo estimado**: 1-2 horas

---

### P0-2: Cola offline NO captura errores de red reales

**Problema confirmado**:
```javascript
// En index.html línea 411
if (isMutation && err.message.indexOf("Tiempo de espera") >= 0) {
  _gasQueueOperation(fn, args.slice(0, -1));  // SOLO captura timeout
  return { queued: true, message: "..." };
}
throw err;  // Otros errores se pierden
```

**Escenario de fallo**:
1. Usuario en carretera, Nariño, sin señal
2. Navegador corta conexión → error "NetworkError"
3. `indexOf("Tiempo de espera")` = -1
4. Error se lanza, operación se pierde
5. Usuario piensa que no se guardó → duplica gasto

**Solución requerida**:
```javascript
// Detectar tipos de error de red
function esErrorRed(err) {
  return err.message.indexOf("Tiempo de espera") >= 0 ||
         err.message.indexOf("NetworkError") >= 0 ||
         err.message.indexOf("Failed to fetch") >= 0 ||
         err.message.indexOf("NET::ERR") >= 0; // Chrome specific
}

if (isMutation && esErrorRed(err)) {
  _gasQueueOperation(fn, args.slice(0, -1));
  return { queued: true, message: "..." };
}
throw err;
```

**Archivos impactados**:
- `src/index.html` - función `GAS.call()`

**Tiempo estimado**: 30 minutos

---

### P0-3: Rate limiting global = DoS trivial

**Problema confirmado**:
```javascript
// En appsscript.json
"executeAs": "USER_DEPLOYING"

// En api.js
Session.getEffectiveUser().getEmail()  // SIEMPRE el del dueño
```

**Escenario de ataque**:
1. Persona externa abre la app
2. Ingresa PIN mal 5 veces
3. App se bloquea para Argoty 5 minutos
4. Repite indefinidamente

**Solución requerida** (opciones):

**Opción A: Contador por device ID (RECOMENDADA)**
```javascript
// En index.html
function obtenerDeviceId() {
  var id = localStorage.getItem("flota_device_id");
  if (!id) {
    id = Utilities.getUuid();
    localStorage.setItem("flota_device_id", id);
  }
  return id;
}

// En verificarPIN
var deviceId = getToken() || obtenerDeviceId();
var cacheKey = "pin_intentos_" + deviceId;  // No email
```

**Opción B: Rate limiting más permisivo**
```javascript
// Aumentar límites
const PIN_MAX_INTENTOS = 10;  // En vez de 5
const PIN_BLOQUEO_SEGUNDOS = 600;  // 10 minutos
```

**Archivos impactados**:
- `src/api.js` - función `verificarPIN()`
- `src/appsscript.json` - considerar cambiar a "ANYONE" (opcional)

**Tiempo estimado**: 1-2 horas

---

### P0-4: Sesión expirada confundida con "sin viaje abierto"

**Problema confirmado**:
```javascript
async function openLiquidacion() {
  try {
    var resumen = await GAS.obtenerResumen("current");
    // ... abre formulario normal
  } catch (e) {
    // Trata CUALQUIER error igual
    document.getElementById("nuevo-viaje").classList.remove("hidden");
    // Usuario crea nuevo viaje sin darse cuenta de que el anterior existe
  }
}
```

**Solución requerida**:
```javascript
async function openLiquidacion() {
  try {
    var resumen = await GAS.obtenerResumen("current");
    // ... abrir formulario
  } catch (e) {
    if (e.message.indexOf("Sesion expirada") >= 0) {
      // Mostrar pantalla de PIN
      showScreen("pin");
      document.getElementById("pin-error").textContent = "Sesión expirada, ingrese el PIN nuevamente";
      document.getElementById("pin-error").style.display = "block";
      document.getElementById("pin-input").value = "";
    } else if (e.message.indexOf("No hay liquidacion abierta") >= 0 || 
               e.message.indexOf("No hay viajes cerrados") >= 0) {
      // Mostrar formulario de nuevo viaje
      document.getElementById("nuevo-viaje").classList.remove("hidden");
    } else {
      // Otros errores - mostrar mensaje genérico
      toast("Error al cargar: " + e.message, "error");
    }
  }
}
```

**Archivos impactados**:
- `src/index.html` - función `openLiquidacion()`

**Tiempo estimado**: 30 minutos

---

### P0-5: Gastos offline invisibles al usuario

**Problema confirmado**:
```javascript
// En agregarGasto()
await GAS.agregarGasto(...);  // Encola si offline
loadResumen();  // .catch(function(){}) silencioso - falla sin señal
// Usuario no ve su gasto
```

**Solución requerida**:
```javascript
async function agregarGastoConFeedback() {
  // ... validaciones
  
  var resultado = await GAS.agregarGasto(...)
    .catch(e => {
      if (e.queued) {
        // Mostrar ítem pendiente en lista local
        agregarGastoPendienteLocally(...);
        toast("Gasto guardado localmente. Se sincronizará con la red.", "success");
      }
      throw e;
    });
  
  // Si éxito, refrescar normalmente
}

function agregarGastoPendienteLocally(gasto) {
  // Agregar a lista local con clase "pending"
  // Mostrar badge "pendiente de sync"
}
```

**Archivos impactados**:
- `src/index.html` - funciones `agregarGasto()`, `renderGastos()`

**Tiempo estimado**: 1-2 horas

---

## 🟠 P1 — MEJORAS DE USABILIDAD

### P1-1: Errores silenciados en capas de lectura

**Archivos con `.catch(function(){})`**:
- `loadResumen()` (línea 592)
- `loadGastos()` (línea 640)
- `loadFletes()` (línea 695)
- `loadAlertas()` (línea 660)
- `loadBitacora()` (línea 950)

**Solución requerida**:
```javascript
// Reemplazar todos por:
.catch(function(e) {
  console.error("Error de carga:", e);
  toast("Error al cargar datos. Verifique conexión.", "error");
});
```

**Tiempo estimado**: 30 minutos

---

## 📋 Plan de Implementación

### Sprint 1: P0 Críticos (4-6 horas)

1. **P0-2**: Cola offline - capturar errores de red
2. **P0-4**: Distinguir error de sesión vs sin viaje
3. **P0-5**: Feedback visual gastos offline
4. **P1-1**: Mensajes de error visibles

### Sprint 2: P0 de alta prioridad (2-3 horas)

5. **P0-1**: Actualizar kmActual al cerrar viaje
6. **P0-3**: Rate limiting por device ID

### Sprint 3: Verificación y pruebas (1-2 horas)

7. Pruebas en modo avión (sin señal)
8. Pruebas de bloqueo de PIN
9. Pruebas de creación doble de viajes

---

## 🧪 Plan de Testing Post-Corrección

| Test | Escenario | Resultado esperado |
|------|-----------|-------------------|
| T01 | Celular en modo avión → agregar gasto | Aparece badge "pendiente de sync" |
| T02 | Reconectar → sincroniza automáticamente | Gasto aparece en lista |
| T03 | PIN mal 10 veces | Bloqueo menor, no afecta otros dispositivos |
| T04 | Sesión expirada → abrir app | Muestra pantalla de PIN, no formulario |
| T05 | Cerrar viaje → verificar kmActual actualizado | Hoja Vehiculo refleja kmFinal |
| T06 | kmFinal < kmActual del vehículo | Error de validación |

---

## 📝 Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/api.js` | `verificarPIN()` rate limiting por device, `cerrarLiquidacion()` actualiza vehiculo |
| `src/index.html` | `GAS.call()` captura errores red, `openLiquidacion()` distingue errores, `agregarGasto()` feedback offline |
| `src/datos/sheets.js` | Posible helper `actualizarVehiculo()` |

---

## ⚠️ Notas de Seguridad

1. **Cambiar access a ANYONE_ANONYMOUS** puede ser necesario si usamos device ID
2. **BACKUP** obligatorio antes de implementar cambios en producción
3. **Documentar** el comportamiento de rate limiting por device ID

---

> ✅ **Estado**: PLAN APROBADO PARA IMPLEMENTACIÓN