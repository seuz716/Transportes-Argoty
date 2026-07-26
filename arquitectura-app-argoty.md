# Arquitectura — App de liquidación de fletes (cliente: Sr. Argoty)

Documento de referencia para el agente de código. No contiene implementación, contiene las decisiones y la estructura que debe respetar. Si algo no está aquí, pregunta antes de inventar.

## 1. Qué resuelve esto

Argoty es transportador. Cada viaje liquida gastos por día (combustible, peajes, comisiones, mantenimiento menor) contra los ingresos del flete (anticipo + pago del viaje). Hoy lo hace a mano en una nota, con este formato:

- Días de la semana como secciones, cada uno con una lista de conceptos + montos y un subtotal
- Una sección de gastos adicionales no atados a un día
- Una sección de fletes (ingresos: anticipo, viaje, otros)
- Balance final = fletes − gastos

La app tiene que producir exactamente ese documento, pero capturado desde el celular y exportado a PDF. Además: comparar un viaje contra otro, avisar de mantenimiento del vehículo, y responder preguntas simples sobre los gastos usando un modelo de lenguaje.

Transporta principalmente arveja, flores y carga en tambores. Rutas desde Nariño hacia Bogotá, Cundinamarca y otros destinos.

## 2. Stack: Google Apps Script + Google Sheets

Un solo proyecto, un solo deploy. Frontend (HtmlService) y backend (funciones del script) viven en el mismo lugar y se comunican vía `google.script.run` — no hay fetch entre dominios, así que no hay problema de CORS que resolver.

**Por qué no Python con backend propio:** para un usuario, con unas pocas filas de datos al día, montar servidor + base de datos persistente es mantenimiento que no se justifica. SQLite no sobrevive en la mayoría de free tiers (el disco se resetea), así que terminarías con Postgres gestionado, variables de entorno, deploys — infraestructura real para un problema que no la necesita.

**Por qué Apps Script sí encaja:** Sheets como base de datos da persistencia gratis y además le da a César visibilidad y edición manual directa si algo falla. Drive y Gmail nativos resuelven PDF y envío sin ninguna librería externa. Ya existe experiencia previa con esta plataforma (MicroERP), así que hay patrones reutilizables.

**Dónde corre para Argoty:** abre la URL del web app en Chrome del celular y usa "Agregar a pantalla de inicio". Queda un ícono que abre directo esa página. No es una PWA instalable con service worker — no la necesitas para cumplir "que corra desde el celular", y meterla añade complejidad que Apps Script no soporta bien de todas formas (el HtmlService corre en un iframe sandboxeado de Google, con restricciones reales sobre qué APIs del navegador funcionan ahí dentro).

**Herramientas de desarrollo:** usa `clasp` desde el arranque. Sin esto, Apps Script se desarrolla en el editor web sin git, sin tests, sin control de versiones real. Con `clasp` el código vive en un repo normal, se edita en cualquier editor, y `clasp push` lo sube al proyecto.

## 3. Modelo de datos (un spreadsheet, varias hojas)

**`Liquidaciones`**
`id | placa | fecha_inicio | fecha_fin | km_inicial | km_final | estado | total_gastos | total_fletes | balance | pdf_url`

`km_inicial` y `km_final` no están en el formato actual de Argoty pero son obligatorios: sin ellos no se puede calcular consumo de ACPM por kilómetro, que es justo una de las alertas que se pidió. Hay que agregarlos al flujo de captura aunque el papel original no los tenga.

**`Gastos`**
`id | liquidacion_id | fecha | dia_semana | categoria | descripcion | monto | es_adicional`

`categoria` es una de: Diario, ACPM, Peajes, Comisión, Coteros, Descargue, Envarillada, Manifiesto, Mantenimiento, Otro. `es_adicional = true` para lo que en el papel aparece bajo "Gastos adicionales" (no atado a un día).

**`Fletes`**
`id | liquidacion_id | concepto | cliente | tipo_carga | monto`

`tipo_carga` (arveja, flores, tambores, etc.) es lo que permite después responder "¿qué transporto más?" sin adivinar.

**`Vehiculo`**
`placa | km_actual | fecha_ultimo_aceite | km_ultimo_aceite | fecha_ultima_engrasada | fecha_ultima_revision_frenos | fecha_ultimo_cambio_llantas | km_ultimo_cambio_llantas`

**`Bitacora`**
`id | liquidacion_id | fecha | nota | monto_opcional | convertido_a_gasto`

Registro libre tipo diario ("almuerzo en tal lugar"). Si tiene monto y se marca `convertido_a_gasto = true`, pasa a la hoja `Gastos` con categoría Otro.

**`Config`**
Umbrales de mantenimiento editables sin tocar código: días entre engrasadas, km entre cambios de aceite, días entre revisión de frenos, km de vida de llantas.

**`Categorias`**
Lista fija que alimenta las tarjetas del UI: nombre, orden de aparición. El monto sugerido por tarjeta no se guarda aquí — se calcula al vuelo como el último monto registrado en esa categoría.

## 4. Backend — funciones expuestas a `google.script.run`

`crearLiquidacion(placa, fechaInicio, kmInicial)`
`agregarGasto(liquidacionId, categoria, descripcion, monto, fecha, esAdicional)`
`agregarFlete(liquidacionId, concepto, cliente, tipoCarga, monto)`
`cerrarLiquidacion(liquidacionId, kmFinal)` — calcula totales, genera el PDF, dispara el insight automático de IA
`obtenerResumenLiquidacion(liquidacionId)`
`compararLiquidaciones(idA, idB)`
`obtenerEstadoVehiculo()` — alertas de mantenimiento pendientes
`preguntarIA(pregunta, liquidacionId)`
`generarPDF(liquidacionId)` — devuelve URL de Drive
`verificarPIN(pin)`

Cada una de estas es una capa delgada de I/O. La lógica de cálculo real vive separada (siguiente sección) y estas funciones solo leen/escriben Sheets y llaman esa lógica.

## 5. Lógica pura — la parte que se testea

Archivo(s) sin ninguna llamada a `SpreadsheetApp`, `UrlFetchApp`, `DriveApp` ni `GmailApp`. Reciben datos, devuelven datos. Esto es lo que hace posible TDD real en Apps Script, que por sí solo no tiene framework de testing.

- `calcularTotalPorDia(gastos, dia)`
- `calcularTotalGastos(gastos)`
- `calcularTotalFletes(fletes)`
- `calcularBalance(fletes, gastos)`
- `calcularConsumoPorKm(totalACPM, kmInicial, kmFinal)`
- `detectarAlertasMantenimiento(vehiculo, config, fechaHoy)`
- `compararLiquidaciones(liquidacionA, liquidacionB)`
- `sugerirMontoPorCategoria(categoria, historicoGastos)`
- `formatearContextoParaIA(liquidacionActual, historico, vehiculo)`

## 6. Frontend (HtmlService)

- Pantalla de PIN antes de cargar cualquier dato
- Grid de tarjetas grandes por categoría de gasto (para usar con el dedo, en carretera). Al tocar una, sugiere el último monto usado en esa categoría; Argoty lo confirma o lo cambia
- Selector de fecha con "hoy" como default
- Vista en vivo de la liquidación abierta: lista de gastos del día, fletes, balance corriendo
- Botón "Cerrar viaje" → pide km final → genera PDF → muestra "Enviar por WhatsApp" (link `wa.me`) y "Enviar por correo" (dispara `GmailApp` desde el servidor, sin pasos extra del usuario)
- Sección de comparación: dos tarjetas lado a lado, un viaje contra otro
- Caja de texto libre para preguntarle a la IA
- Banner de alertas de mantenimiento, visible solo si hay algo pendiente

Ningún cálculo financiero vive en el HTML o el JS del cliente. Todo pasa por las funciones puras del backend.

## 7. PDF

Plantilla en Google Docs con marcadores de posición, poblada vía `DocumentApp`, exportada como PDF (`getAs(MimeType.PDF)`), guardada en Drive. El layout debe reproducir el formato que Argoty ya conoce: secciones por día con subtotal, adicionales, total de gastos, fletes, balance final. No inventar un formato nuevo — el objetivo es que reconozca el documento, no que se vea "más bonito".

## 8. Asistente de IA (Gemini Flash)

Un único punto de entrada: `llamarGeminiFlash(prompt)` vía `UrlFetchApp`, API key leída de `PropertiesService.getScriptProperties()` — nunca en el cliente, nunca en el HTML.

Contexto que se le pasa en cada llamada: negocio de Argoty (transporte de carga, rutas Nariño–Bogotá/Cundinamarca, tipos de carga habituales), resumen de la liquidación actual, resumen de las últimas 2-3 liquidaciones, estado del vehículo con alertas activas.

Dos formas de disparo:
- Manual: Argoty escribe una pregunta
- Automático: al cerrar una liquidación, se genera un insight sin que lo pida (comparación con el viaje anterior + chequeo de mantenimiento pendiente)

Con 1-2 llamadas al día el uso queda cómodo dentro del free tier de Gemini Flash. Si ya tienes configurada una key de pago automático en AI Studio, usa una key separada sin billing habilitado para este proyecto, o pon un límite de cuota — si mezclas la key de pago con esto, "costo casi cero" deja de ser cierto por accidente.

**Renderizado de la respuesta: solo texto plano, nunca HTML.** Insertar con `textContent`, no con `innerHTML`. MicroERP ya tuvo una vulnerabilidad XSS exactamente en el renderizado de respuestas de Gemini — no la repitas aquí.

## 9. Mantenimiento

`detectarAlertasMantenimiento` corre cada vez que se abre la app y compara `Vehiculo` contra los umbrales de `Config`. Sin push notifications reales — eso pediría una PWA con service worker, que ya se descartó en la sección 2. El banner al abrir la app cubre el caso de uso real: Argoty la abre todos los días para registrar gastos, así que la alerta le llega en el momento en que de todas formas está usando la app.

## 10. Seguridad

- PIN de 4-6 dígitos guardado en `PropertiesService`, verificado antes de mostrar cualquier dato. No es autenticación real, es fricción mínima contra que alguien con el link entre por accidente. Si más adelante se quiere algo más fuerte, la ruta es restringir el acceso del deploy a cuentas específicas de Google
- API key de Gemini solo server-side
- Todo cálculo financiero se valida en el servidor. Nunca confíes en un total que llega calculado desde el cliente — MicroERP ya tuvo un bypass de límite de crédito por confiar en datos del lado equivocado. Aquí el mismo patrón de error sería, por ejemplo, aceptar un `balance` que manda el HTML en vez de recalcularlo en el backend con los datos crudos

## 11. Costos

Apps Script: gratis, dentro de cuota de cuenta personal (20.000 llamadas UrlFetch/día, ~100 correos/día, 90 min de runtime de trigger/día). Sheets: gratis hasta 2 millones de celdas, muy por encima de lo que esto va a usar en años. Gemini Flash: gratis dentro del free tier para el volumen descrito. Total: cero, siempre que no se mezcle con una key de pago existente.

## 12. Plan de desarrollo — orden obligatorio

**Fase 0.** Setup del repo con `clasp`. Estructura: `/src` (código Apps Script), `/src/logica` (funciones puras), `/tests` (Jest).

**Fase 1 — tests primero.** Escribir en Jest los tests de cada función de la sección 5, usando los números de la imagen original como caso real (el viaje SAV792 con balance final de 163.800 es el caso de prueba). Implementar recién después, hasta que pasen. Nada de Sheets, Drive, Gmail ni Gemini en esta fase.

**Fase 2.** Capa de datos: leer/escribir las hojas de la sección 3, usando las funciones de la Fase 1 para cualquier cálculo. Probar con datos reales cargados a mano.

**Fase 3.** UI sobre la API ya probada. Cero lógica de cálculo en el HTML.

**Fase 4.** PDF y envío (wa.me + Gmail).

**Fase 5.** Integración de IA.

**Fase 6.** PIN, revisión de cuotas, prueba en el celular real de Argoty.

No se avanza de fase sin que la anterior tenga sus tests en verde.

## 13. Fuera de alcance v1

Push notifications reales, OCR de recibos, multi-usuario, facturación electrónica DIAN. Integración con MicroERP como módulo de ingresos es una extensión natural a futuro dado que comparte plataforma, pero no es parte de esta primera entrega.
