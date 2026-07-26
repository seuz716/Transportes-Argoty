function obtenerScriptSpreadsheet() {
  const scriptId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!scriptId) {
    throw new Error("SPREADSHEET_ID no configurado en PropertiesService");
  }
  return SpreadsheetApp.openById(scriptId);
}

function obtenerHoja(nombre) {
  const ss = obtenerScriptSpreadsheet();
  let hoja = ss.getSheetByName(nombre);
  if (!hoja) {
    hoja = ss.insertSheet(nombre);
    agregarEncabezados(hoja, nombre);
  }
  return hoja;
}

function agregarEncabezados(hoja, nombre) {
  let encabezados = [];
  switch (nombre) {
    case "Liquidaciones":
      encabezados = ["id", "placa", "fecha_inicio", "fecha_fin", "km_inicial", "km_final", "estado", "total_gastos", "total_fletes", "balance", "pdf_url"];
      break;
    case "Gastos":
      encabezados = ["id", "liquidacion_id", "fecha", "dia_semana", "categoria", "descripcion", "monto", "es_adicional"];
      break;
    case "Fletes":
      encabezados = ["id", "liquidacion_id", "concepto", "cliente", "tipo_carga", "monto"];
      break;
    case "Vehiculo":
      encabezados = ["placa", "km_actual", "fecha_ultimo_aceite", "km_ultimo_aceite", "fecha_ultima_engrasada", "fecha_ultima_revision_frenos", "fecha_ultimo_cambio_llantas", "km_ultimo_cambio_llantas"];
      break;
    case "Bitacora":
      encabezados = ["id", "liquidacion_id", "fecha", "nota", "monto_opcional", "convertido_a_gasto"];
      break;
    case "Config":
      encabezados = ["clave", "valor"];
      break;
    case "Categorias":
      encabezados = ["nombre", "orden"];
      break;
    default:
      encabezados = ["id", "nombre"];
  }
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
}

function leerFilas(hoja, desde, hasta) {
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return [];
  const fin = hasta ? Math.min(hasta, ultimaFila) : ultimaFila;
  if (desde > fin) return [];
  const datos = hoja.getRange(desde, 1, fin - desde + 1, hoja.getLastColumn()).getValues();
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  return datos.map((fila) => {
    const obj = {};
    encabezados.forEach((enc, i) => {
      obj[enc] = fila[i];
    });
    return obj;
  });
}

function escribirFilas(hoja, datos, desdeFila) {
  if (!datos || datos.length === 0) return 0;
  const columnas = Object.keys(datos[0]).length;
  const values = datos.map((fila) => Object.values(fila));
  hoja.getRange(desdeFila, 1, values.length, columnas).setValues(values);
  return values.length;
}

function agregarFila(hoja, datos) {
  const filas = leerFilas(hoja, 2);
  const siguienteFila = filas.length + 2;
  escribirFilas(hoja, [datos], siguienteFila);
  return siguienteFila;
}

function obtenerFilasFiltradas(hoja, columna, valor) {
  const todas = leerFilas(hoja, 2);
  return todas.filter((fila) => String(fila[columna]) === String(valor));
}

function obtenerProximoId(hoja) {
  const filas = leerFilas(hoja, 2);
  if (filas.length === 0) return 1;
  const ids = filas.map((f) => parseInt(f.id, 10) || 0);
  return Math.max(...ids) + 1;
}

module.exports = {
  obtenerScriptSpreadsheet,
  obtenerHoja,
  agregarEncabezados,
  leerFilas,
  escribirFilas,
  agregarFila,
  obtenerFilasFiltradas,
  obtenerProximoId,
};