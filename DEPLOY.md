# 🚀 Guía de Deploy — Transportes Argoty

## Prerrequisitos

1. ✅ Tener cuenta de Google con acceso a Apps Script
2. ✅ Tener Node.js instalado (v14+)
3. ✅ Haber ejecutado `npm install`

## Paso a Paso

### 1. Crear proyecto GAS

1. Ve a [script.google.com](https://script.google.com)
2. **Nuevo proyecto** → Name: "Transportes Argoty"
3. Copia el **Script ID** (empieza con `MP...`)

### 2. Configurar .clasp.json

```bash
# Edita .clasp.json
{
  "scriptId": "TU_SCRIPT_ID_AQUI",
  "rootDir": "./src"
}
```

### 3. Login con clasp

```bash
npm run login
# Abre el link en tu navegador, autoriza y vuelve
```

### 4. Push del código

```bash
npm run push
# Verifica que suba sin errores
```

### 5. Crear Spreadsheet (base de datos)

1. Crea un Google Spreadsheet nuevo
2. Name: "Argoty - Liquidaciones"
3. Copia el ** Spreadsheet ID** (del URL)
4. Comparte con tu cuenta de Google

### 6. Configurar PropertiesService

Ejecuta esto en la consola de Apps Script (Extensiones > Apps Script > Editor > Console):

```javascript
// Configuración inicial
PropertiesService.getScriptProperties().setProperties({
  'SPREADSHEET_ID': 'TU_SPREADSHEET_ID_AQUI',
  'PIN': '123456',
  'PDF_FOLDER': '' // Opcional: ID de carpeta para PDFs
});
```

### 7. Crear deploy Web App

1. En el editor de Apps Script: **Implementar > Nueva implementación**
2. Tipo: **App web**
3. Ejecutar como: **Yo (USER_DEPLOYING)**
4. Acceso: 
   - **Opción A (recomendado)**: **Yo mismo (MYSELF)** - Solo el dueño puede acceder
   - **Opción B**: **Cualquiera con el enlace (ANYONE_WITH_LINK)** - Para compartir con otros
5. Deploy URL: Copia el enlace

> **Nota**: La configuración actual en `appsscript.json` es `MYSELF`. Cambia a `ANYONE_WITH_LINK` solo si necesitas compartir la app.

### 8. Agregar a pantalla de inicio (Android/iOS)

1. Abre la URL del Web App en Chrome del celular
2. Toca los 3 puntos → **Agregar a pantalla de inicio**
3. ¡Listo! Un ícono en la pantalla principal

## Verificación

- [ ] Spreadsheet creado con hojas: Liquidaciones, Gastos, Fletes, Vehiculo, Config
- [ ] SPREADSHEET_ID configurado en PropertiesService
- [ ] PIN inicial configurado (default: 123456)
- [ ] Web App desplegado
- [ ] Acceso desde celular funcionando

## Solución de Problemas

### Error: "SPREADSHEET_ID no configurado"
Ejecuta el script de setup en consola.

### Error: "No se puede acceder a la hoja"
Verifica que el Spreadsheet ID sea correcto y esté compartido.

### Error: "PIN incorrecto"
Inicia sesión y reinicia el PIN:
```javascript
PropertiesService.getScriptProperties().setProperty('PIN', '123456');
```

## 🔄 Cambios Recientes

### v0.2.0 - 2026-07-29

#### Nuevas funcionalidades:
- **Gastos adicionales**: Ahora puedes marcar gastos como "adicionales" (no asignados a un día específico)
  - Checkbox en el formulario de gastos
  - Badge "Adic." en la lista
  - Sección separada en el PDF
- **Mejora cola offline**: 
  - Refactorización completada
  - Reintentos automáticos (máx 3 intentos)
  - Eliminación segura de operaciones procesadas
- **Display de día de la semana**: Muestra el día seleccionado al agregar gastos

#### Correcciones:
- Validación correcta de fechas para gastos adicionales
- Cálculo correcto de totales por día (excluye adicionales)
- Tooltip en contador de operaciones pendientes

---

## 📚 Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 0.2.0 | 2026-07-29 | Gastos adicionales, cola offline refactorizada |
| 0.1.0 | 2026-07-28 | Lanzamiento inicial |