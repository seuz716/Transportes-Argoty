function crearLiquidacion(placa, fechaInicio, kmInicial) {
  var hoja = obtenerHoja("Liquidaciones");
  var id = obtenerProximoId(hoja);
  var liquidacion = {
    id: String(id),
    placa: placa,
    fechaInicio: fechaInicio,
    fechaFin: null,
    kmInicial: kmInicial,
    kmFinal: null,
    estado: "abierta",
    totalGastos: 0,
    totalFletes: 0,
    balance: 0,
    pdfUrl: "",
  };
  agregarFila(hoja, liquidacion);
  return liquidacion;
}

function agregarGasto(liquidacionId, categoria, descripcion, monto, fecha, esAdicional) {
  var hoja = obtenerHoja("Gastos");
  var id = obtenerProximoId(hoja);
  var gasto = {
    id: String(id),
    liquidacionId: liquidacionId,
    fecha: fecha,
    diaSemana: new Date(fecha).toLocaleDateString("es-CO", { weekday: "long" }),
    categoria: categoria,
    descripcion: descripcion,
    monto: monto,
    esAdicional: esAdicional,
  };
  agregarFila(hoja, gasto);
  return gasto;
}

function agregarFlete(liquidacionId, concepto, cliente, tipoCarga, monto) {
  var hoja = obtenerHoja("Fletes");
  var id = obtenerProximoId(hoja);
  var flete = {
    id: String(id),
    liquidacionId: liquidacionId,
    concepto: concepto,
    cliente: cliente,
    tipoCarga: tipoCarga,
    monto: monto,
  };
  agregarFila(hoja, flete);
  return flete;
}

function cerrarLiquidacion(liquidacionId, kmFinal) {
  var hojaLiq = obtenerHoja("Liquidaciones");
  var liqFilas = leerFilas(hojaLiq, 2);
  var idx = -1;
  for (var i = 0; i < liqFilas.length; i++) {
    if (liqFilas[i].id === liquidacionId) {
      idx = i;
      break;
    }
  }
  if (idx === -1) throw new Error("Liquidacion " + liquidacionId + " no encontrada");

  var gastos = obtenerFilasFiltradas(obtenerHoja("Gastos"), "liquidacionId", liquidacionId);
  var fletes = obtenerFilasFiltradas(obtenerHoja("Fletes"), "liquidacionId", liquidacionId);

  var totalGastos = calcularTotalGastos(gastos);
  var totalFletes = calcularTotalFletes(fletes);
  var balance = calcularBalance(fletes, gastos);

  var totalACPM = 0;
  for (var j = 0; j < gastos.length; j++) {
    if (gastos[j].categoria === "ACPM") {
      totalACPM += gastos[j].monto;
    }
  }
  var consumoKm = calcularConsumoPorKm(totalACPM, liqFilas[idx].kmInicial, kmFinal);

  liqFilas[idx].fechaFin = new Date().toISOString().split("T")[0];
  liqFilas[idx].kmFinal = kmFinal;
  liqFilas[idx].estado = "cerrada";
  liqFilas[idx].totalGastos = totalGastos;
  liqFilas[idx].totalFletes = totalFletes;
  liqFilas[idx].balance = balance;
  liqFilas[idx].consumoKm = consumoKm;

  var valores = Object.values(liqFilas[idx]);
  hojaLiq.getRange(idx + 2, 1, 1, valores.length).setValues([valores]);

  return {
    id: liqFilas[idx].id,
    placa: liqFilas[idx].placa,
    fechaInicio: liqFilas[idx].fechaInicio,
    fechaFin: liqFilas[idx].fechaFin,
    kmInicial: liqFilas[idx].kmInicial,
    kmFinal: liqFilas[idx].kmFinal,
    estado: liqFilas[idx].estado,
    totalGastos: totalGastos,
    totalFletes: totalFletes,
    balance: balance,
    consumoKm: consumoKm,
    pdfUrl: liqFilas[idx].pdfUrl,
  };
}

function obtenerResumenLiquidacion(liquidacionId) {
  var gastos = obtenerFilasFiltradas(obtenerHoja("Gastos"), "liquidacionId", liquidacionId);
  var fletes = obtenerFilasFiltradas(obtenerHoja("Fletes"), "liquidacionId", liquidacionId);
  var totalGastos = calcularTotalGastos(gastos);
  var totalFletes = calcularTotalFletes(fletes);
  var balance = calcularBalance(fletes, gastos);
  var totalPorDia = {};
  var diasSet = {};
  for (var i = 0; i < gastos.length; i++) {
    diasSet[gastos[i].diaSemana] = true;
  }
  var dias = Object.keys(diasSet);
  for (var d = 0; d < dias.length; d++) {
    totalPorDia[dias[d]] = calcularTotalPorDia(gastos, dias[d]);
  }

  return { totalGastos: totalGastos, totalFletes: totalFletes, balance: balance, totalPorDia: totalPorDia, gastos: gastos, fletes: fletes };
}

function compararLiquidaciones(idA, idB) {
  var resumenA = obtenerResumenLiquidacion(idA);
  var resumenB = obtenerResumenLiquidacion(idB);
  var balanceA = calcularBalance(
    resumenA.totalFletes > 0 ? [{ monto: resumenA.totalFletes }] : [],
    [{ monto: resumenA.totalGastos }]
  );
  var balanceB = calcularBalance(
    resumenB.totalFletes > 0 ? [{ monto: resumenB.totalFletes }] : [],
    [{ monto: resumenB.totalGastos }]
  );
  var ganador = null;
  if (balanceA > balanceB) ganador = idA;
  else if (balanceB > balanceA) ganador = idB;

  return {
    balanceDiferencia: Math.abs(balanceA - balanceB),
    gastosDiferencia: Math.abs(resumenA.totalGastos - resumenB.totalGastos),
    fletesDiferencia: Math.abs(resumenA.totalFletes - resumenB.totalFletes),
    mejorBalance: ganador,
  };
}

function obtenerEstadoVehiculo() {
  var vehiculo = obtenerFilasFiltradas(obtenerHoja("Vehiculo"), "placa", obtenerPlacaActiva())[0];
  if (!vehiculo) return [];
  var config = {};
  var configFilas = leerFilas(obtenerHoja("Config"), 2);
  for (var i = 0; i < configFilas.length; i++) {
    config[configFilas[i].clave] = configFilas[i].valor;
  }
  return detectarAlertasMantenimiento(vehiculo, config, new Date().toISOString().split("T")[0]);
}

function obtenerPlacaActiva() {
  var liq = obtenerLiquidacionAbierta();
  return liq ? liq.placa : null;
}

function preguntarIA(pregunta, liquidacionId) {
  throw new Error("Gemini Flash no configurado. Pendiente de Fase 5.");
}

function generarPDF(liquidacionId) {
  throw new Error("Generacion de PDF no implementada. Pendiente de Fase 4.");
}

function verificarPIN(pin) {
  var prop = PropertiesService.getScriptProperties();
  var pinGuardado = prop.getProperty("PIN");
  if (!pinGuardado) {
    prop.setProperty("PIN", pin);
    return true;
  }
  return pinGuardado === pin;
}

function obtenerLiquidacionAbierta() {
  var hoja = obtenerHoja("Liquidaciones");
  var filas = leerFilas(hoja, 2);
  for (var i = 0; i < filas.length; i++) {
    if (filas[i].estado === "abierta") return filas[i];
  }
  return null;
}