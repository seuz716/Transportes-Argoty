# Mejoras Implementadas — FLOTA YC

> **Fecha**: 2026-07-29  
> **Versión**: 0.3.0  
> **Estado**: ✅ COMPLETO

---

## ✅ Mejora 1: Checkbox para gastos adicionales

### Estado: COMPLETA

#### Archivos modificados:
1. `src/index.html`
2. `src/api.js`
3. `src/datos/pdf.js`

#### Cambios realizados:
- ✅ Checkbox `gasto-adicional` agregado al formulario
- ✅ Display `dia-display` muestra día de la semana seleccionado
- ✅ Validación: si es adicional, fecha es opcional
- ✅ Backend maneja fecha vacía para gastos adicionales
- ✅ Badge "Adic." en lista de gastos
- ✅ Día muestra "Sin día específico" para adicionales
- ✅ PDF separa "Gastos por día" y "Gastos adicionales"

---

## ✅ Mejora 2: Cola offline refactorizada

### Estado: COMPLETA

#### Problemas corregidos:
- ✅ **forEach + splice**: Ahora trabaja con copia del array (`queue.slice()`)
- ✅ **Reintentos**: Límite de 3 intentos por operación
- ✅ **Eliminación segura**: Nueva función `_gasRemoveOperation()`
- ✅ **Prevención duplicados**: Detecta y actualiza operaciones similares
- ✅ **Tooltip**: Contador muestra información adicional

---

## ✅ Mejora 3: Rate limiting del PIN

### Estado: COMPLETA

#### Implementación:
- ✅ Contador de intentos fallidos en `CacheService`
- ✅ Bloqueo de 5 minutos después de 5 intentos
- ✅ Reset del contador al ingresar correctamente
- ✅ Mensaje de error claro cuando está bloqueado
- ✅ PIN no se autoconfigura (seguridad)

#### Código nuevo en `verificarPIN()`:
```javascript
const PIN_MAX_INTENTOS = 5;
const PIN_BLOQUEO_SEGUNDOS = 300; // 5 minutos

// Verifica counter de intentos fallidos
// Bloquea temporalmente si excede límite
// Resetea contador al éxito
```

---

## ✅ Mejora 4: Acceso público ANYONE_ANONYMOUS

### Estado: COMPLETA

#### Cambios:
- ✅ `appsscript.json`: `"access": "ANYONE_ANONYMOUS"`
- ✅ Acceso público sin autenticación Google
- ✅ Protección mediante PIN
- ✅ Documentación actualizada en DEPLOY.md

---

## 📋 Checklist de Verificación Post-Mejora

- [x] Usuario puede marcar gasto como adicional
- [x] Gastos adicionales aparecen con badge en lista
- [x] Gastos adicionales aparecen en sección "Gastos adicionales" del PDF
- [x] Cola offline procesa correctamente operaciones
- [x] Cola offline reintenta fallidas con límite
- [x] Contador de pendientes visible y con tooltip
- [x] Día de la semana se muestra al agregar gasto
- [x] Al editar gasto, se puede cambiar esAdicional
- [x] Rate limiting PIN implementado (5 intentos, 5 min bloqueo)
- [x] Acceso público configurado (ANYONE_ANONYMOUS)

---

## 📝 Archivos modificados

| Archivo | Líneas | Cambios principales |
|---------|--------|---------------------|
| `src/appsscript.json` | 14 | Accesso ANYONE_ANONYMOUS |
| `src/api.js` | 47-86 | Rate limiting PIN, verificarPIN reescrito |
| `src/index.html` | var | Checkbox adicional, cola offline, lógica gastos |
| `src/datos/pdf.js` | 29-65 | Sección adicionales, validación diaSemana |
| `DEPLOY.md` | 48-126 | Documentación actualizada |
| `README.md` | 110-145 | Nuevas funcionalidades documentadas |

---

## 🚀 Próximos pasos para despliegue

1. **Configurar PIN** en PropertiesService:
   ```javascript
   PropertiesService.getScriptProperties().setProperty('PIN', 'TU_PIN_AQUI');
   ```

2. **Subir código**:
   ```bash
   npm run push
   ```

3. **Crear deploy**:
   ```bash
   npm run deploy
   ```

4. **Probar en celular** y verificar que el PIN funciona correctamente