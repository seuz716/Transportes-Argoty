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
      encabezados = ["id", "placa", "fechaInicio", "fechaFin", "kmInicial", "kmFinal", "estado", "totalGastos", "totalFletes", "balance", "consumoKm", "pdfUrl"];
      break;
    case "Gastos":
      encabezados = ["id", "liquidacionId", "fecha", "diaSemana", "categoria", "descripcion", "monto", "esAdicional"];
      break;
    case "Fletes":
      encabezados = ["id", "liquidacionId", "concepto", "cliente", "tipoCarga", "monto"];
      break;
    case "Vehiculo":
      encabezados = ["placa", "kmActual", "fechaUltimoAceite", "kmUltimoAceite", "fechaUltimaEngrasada", "fechaUltimaRevisionFrenos", "fechaUltimoCambioLlantas", "kmUltimoCambioLlantas"];
      break;
    case "Bitacora":
      encabezados = ["id", "liquidacionId", "fecha", "nota", "montoOpcional", "convertidoAGasto"];
      break;
    case "Config":
      encabezados = ["clave", "valor"];
      break;
    case "Categorias":
      encabezados = ["nombre", "orden", "icono"];
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

function editarFila(hoja, idColumn, id, datos) {
  const filas = leerFilas(hoja, 2);
  const idx = filas.findIndex((f) => String(f[idColumn]) === String(id));
  if (idx === -1) throw new Error("Fila con id " + id + " no encontrada");
  const sheetRow = idx + 2;
  const columnas = Object.keys(datos);
  const values = [Object.values(datos)];
  hoja.getRange(sheetRow, 1, 1, columnas.length).setValues(values);
  return datos;
}

function eliminarFila(hoja, idColumn, id) {
  const filas = leerFilas(hoja, 2);
  const idx = filas.findIndex((f) => String(f[idColumn]) === String(id));
  if (idx === -1) throw new Error("Fila con id " + id + " no encontrada");
  const sheetRow = idx + 2;
  hoja.deleteRow(sheetRow);
  return true;
}

if (typeof module !== "undefined") {
  module.exports = {
    obtenerScriptSpreadsheet,
    obtenerHoja,
    agregarEncabezados,
    leerFilas,
    escribirFilas,
    agregarFila,
    obtenerFilasFiltradas,
    obtenerProximoId,
    editarFila,
    eliminarFila,
  };
}
