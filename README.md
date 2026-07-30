# FLOTA YC — App de liquidacion de fletes

## Que es

App de Google Apps Script que permite a FLOTA YC liquidar fletes desde el celular: registrar gastos por dia, fletes (ingresos), generar PDFs y consultar un asistente de IA (Gemini Flash).

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Google Apps Script (V8 runtime) |
| Base de datos | Google Sheets |
| Frontend | HtmlService (HTML/CSS/JS) |
| PDF | Google Docs Template + `DocumentApp` |
| IA | Gemini Flash via `UrlFetchApp` |
| Dev tooling | `clasp` + Jest |

## Estructura del proyecto

```
Transportes-Argoty/
├── .clasp.json          # Config de clasp (scriptId)
├── .claspignore         # Archivos que no se suben a GAS
├── .gitignore           # Ignora secrets, node_modules
├── package.json         # Scripts + jest
├── jest.config.js       # Configuración de tests
├── src/
│   ├── appsscript.json  # Manifest de Apps Script
│   ├── main.js          # doGet() — entrypoint del web app
│   ├── api.js           # Funciones para google.script.run
│   ├── logica/
│   │   └── calculos.js  # Funciones puras (testeables)
│   ├── datos/
│   │   ├── sheets.js    # Lectura/escritura de Sheets
│   │   └── pdf.js       # Generación de PDF
│   └── ui/
│       ├── index.html   # Interfaz principal
│       └── styles.css   # Estilos mobile
├── tests/
│   ├── calculos.test.js # 28 tests (Fase 1)
│   └── fixtures/
│       └── viajes.js    # Fixture del viaje SAV792
└── arquitectura-app-argoty.md  # Documento de diseño
```

## Setup rápido

### 1. Clonar el repo
```bash
git clone git@github.com:seuz716/Transportes-Argoty.git
cd Transportes-Argoty
```

### 2. Configurar `clasp`
```bash
clasp login --no-localhost
```
Abrí la URL que aparece en tu navegador y copiá el código de autorización.

### 3. Crear el proyecto en Google Apps Script
1. Ir a [script.google.com](https://script.google.com)
2. Click en **Nuevo proyecto**
3. Copiar el **Script ID** (Parte en `/d/` entre el ID y `/edit`)
4. Pegar en `.clasp.json` donde dice `"PUT_SCRIPT_ID_HERE"`

### 4. Configurar el spreadsheet
Crear un Google Sheet con las siguientes hojas (tab):
- **Liquidaciones** — encabezados: `id | placa | fecha_inicio | fecha_fin | km_inicial | km_final | estado | total_gastos | total_fletes | balance | pdf_url`
- **Gastos** — encabezados: `id | liquidacion_id | fecha | dia_semana | categoria | descripcion | monto | es_adicional`
- **Fletes** — encabezados: `id | liquidacion_id | concepto | cliente | tipoCarga | monto`
- **Vehiculo** — encabezados: `placa | km_actual | fecha_ultimo_aceite | km_ultimo_aceite | fecha_ultima_engrasada | fecha_ultima_revision_frenos | fecha_ultimo_cambio_llantas | km_ultimo_cambio_llantas`
- **Config** — encabezados: `clave | valor`
- **Categorias** — encabezados: `nombre | orden`
- **Bitacora** — encabezados: `id | liquidacion_id | fecha | nota | monto_opcional | convertido_a_gasto`

### 5. Sincronizar con clasp
```bash
# Copiar .clasp.json.example a .clasp.json y completar Script ID
cp .clasp.json.example .clasp.json
# Editar .clasp.json con tu Script ID
nano .clasp.json
```

### 6. Deploy
```bash
clasp push           # Sube código a Google
clasp deploy         # Crea new deployment / web app (opciona: "Anyone with link")
```

### 7. Tests
```bash
npm test             # 28 tests — todos deben pasar
npx jest --coverage  # Con reporte de cobertura
```

## Fases del plan de desarrollo

| Fase | Contenido | Tests |
|------|-----------|-------|
| 0 | Setup repo + clasp + Jest | — (infraestructura) |
| 1 | Funciones puras calculos.js | 28 tests ✅ |
| 2 | Capa de datos (Sheets) + API | — |
| 3 | UI completa (mobile-first) | — |
| 4 | PDF + envío (wa.me + Gmail) | — |
| 5 | Integración Gemini Flash | — |
| 6 | PIN + deploy en celular de Argoty | — |

**Regla**: No se avanza de fase sin que la fase anterior tenga sus tests en verde.

## Seguridad

- PIN de 4-6 dígitos guardado en `PropertiesService` (no en localStorage del navegador)
- API key de Gemini solo en `PropertiesService` del servidor (nunca en el HTML del cliente)
- Todo cálculo financiero se valida en el backend — nunca confiarse en totals que llegan del cliente
- Respuestas de IA se renderizan con `textContent`, nunca `innerHTML`

## Nuevas Funcionalidades (v0.2.0)

### Gastos Adicionales
- Marcar gastos como "adicionales" (no asignados a un día específico)
- Badge "Adic." en la lista de gastos
- Sección separada "Gastos adicionales" en el PDF
- Subtotal de adicionales en el PDF

### Cola Offline Mejorada
- Reintentos automáticos (máximo 3 intentos)
- Eliminación segura de operaciones procesadas
- Prevención de operaciones duplicadas
- Tooltip en contador de operaciones pendientes

### UX Mejorado
- Display dinámico del día de la semana al agregar gastos
- Validación de fechas: si es adicional, la fecha es opcional
- Contador de pendientes más visible con tooltip

## Costos

Apps Script + Sheets + Gemini Flash (free tier): **$0**
