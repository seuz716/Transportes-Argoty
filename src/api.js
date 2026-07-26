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
    if (liqFilas[i].id === liquidacionId) { idx = i; break; }
  }
  if (idx === -1) throw new Error("Liquidacion " + liquidacionId + " no encontrada");

  var gastos = obtenerFilasFiltradas(obtenerHoja("Gastos"), "liquidacionId", liquidacionId);
  var fletes = obtenerFilasFiltradas(obtenerHoja("Fletes"), "liquidacionId", liquidacionId);

  var totalGastos = calcularTotalGastos(gastos);
  var totalFletes = calcularTotalFletes(fletes);
  var balance = calcularBalance(fletes, gastos);

  var totalACPM = 0;
  for (var j = 0; j < gastos.length; j++) {
    if (gastos[j].categoria === "ACPM") totalACPM += gastos[j].monto;
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

  var pdfUrl = "";
  try {
    pdfUrl = generarPDFLiquidacion(liquidacionId, liqFilas[idx], fletes, gastos);
    liqFilas[idx].pdfUrl = pdfUrl;
    var v2 = Object.values(liqFilas[idx]);
    hojaLiq.getRange(idx + 2, 1, 1, v2.length).setValues([v2]);
  } catch (e) {
    Logger.log("PDF error: " + e.message);
  }

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
    pdfUrl: pdfUrl,
  };
}

function generarPDFLiquidacion(liquidacionId, datos, fletes, gastos) {
  var doc = DocumentApp.create("Liquidacion " + liquidacionId);
  var body = doc.getBody();

  body.appendParagraph("LIQUIDACION DE FLETES")
      .setHeading(DocumentApp.ParagraphHeading.HEADING1)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph("Viaje " + liquidacionId)
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

  body.appendParagraph(
      "Fecha inicio: " + datos.fechaInicio +
      " | Fecha fin: " + (datos.fechaFin || new Date().toISOString().split("T")[0])
  ).setFontSize(10);

  body.appendParagraph(
      "Vehiculo: " + datos.placa +
      " | Km " + datos.kmInicial + " a " + datos.kmFinal +
      " (" + (datos.kmFinal - datos.kmInicial) + " km)"
  ).setFontSize(10);

  if (datos.consumoKm) {
    body.appendParagraph("Consumo ACPM: $" + datos.consumoKm.toFixed(2) + "/km").setFontSize(10);
  }

  body.appendParagraph("").setHeading(DocumentApp.ParagraphHeading.HEADING2).setText(" Gastos por dia");

  var dias = {};
  gastos.forEach(function(g) {
    if (!dias[g.diaSemana]) dias[g.diaSemana] = [];
    dias[g.diaSemana].push(g);
  });

  var diasOrden = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  diasOrden.forEach(function(dia) {
    var items = dias[dia];
    if (!items || items.length === 0) return;
    body.appendParagraph(dia).setBold(true).setFontSize(11);
    items.forEach(function(item) {
      body.appendParagraph(
          "  " + item.descripcion + " - $" + item.monto.toLocaleString("es-CO") +
          " [" + item.categoria + "]"
      ).setFontSize(10);
    });
    var subtotal = items.reduce(function(s, i) { return s + i.monto; }, 0);
    body.appendParagraph("  Subtotal: $" + subtotal.toLocaleString("es-CO"))
        .setFontSize(10).setBold(true);
  });

  var adicionales = gastos.filter(function(g) { return g.esAdicional; });
  if (adicionales.length > 0) {
    body.appendParagraph("").setHeading(DocumentApp.ParagraphHeading.HEADING2).setText(" Gastos adicionales");
    adicionales.forEach(function(item) {
      body.appendParagraph(
          "  " + item.descripcion + " - $" + item.monto.toLocaleString("es-CO") +
          " [" + item.categoria + "]"
      ).setFontSize(10);
    });
  }

  body.appendParagraph("").setHeading(DocumentApp.ParagraphHeading.HEADING2).setText(" Resumen financiero");

  var totalFletes = fletes.reduce(function(s, f) { return s + f.monto; }, 0);
  var totalGastos = gastos.reduce(function(s, g) { return s + g.monto; }, 0);
  var balance = totalFletes - totalGastos;

  body.appendTable([
    ["Concepto", "Monto"],
    ["Total fletes (ingresos)", "$" + totalFletes.toLocaleString("es-CO")],
    ["Total gastos", "$" + totalGastos.toLocaleString("es-CO")],
    ["BALANCE", balance >= 0 ? "$" + balance.toLocaleString("es-CO") : "-$" + Math.abs(balance).toLocaleString("es-CO")],
  ]).setFontSize(10);

  var pdfBlob = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF);
  var pdfName = "Liquidacion_" + liquidacionId + ".pdf";
  var folderId = PropertiesService.getScriptProperties().getProperty("PDF_FOLDER");
  var pdfFile;
  if (folderId) {
    try {
      var folder = DriveApp.getFolderById(folderId);
      pdfFile = folder.createFile(pdfBlob).setName(pdfName);
    } catch (e) {
      pdfFile = DriveApp.createFile(pdfBlob).setName(pdfName);
    }
  } else {
    pdfFile = DriveApp.createFile(pdfBlob).setName(pdfName);
  }

  doc.setTrashed(true);
  return pdfFile.getUrl();
}

function enviarWhatsApp(liquidacionId, pdfUrl, balance) {
  var mensaje = "Liquidacion " + liquidacionId + " completada. Balance: $" + balance.toLocaleString("es-CO") + ". PDF: " + pdfUrl;
  return "https://wa.me/?text=" + encodeURIComponent(mensaje);
}

function enviarEmail(destinatario, asunto, cuerpo, pdfUrl) {
  try {
    var response = UrlFetchApp.fetch(pdfUrl);
    var pdfBlob = response.getBlob().setName("Liquidacion.pdf");
    GmailApp.sendEmail(destinatario, asunto, cuerpo, {
      attachments: [{ fileName: "Liquidacion.pdf", content: pdfBlob.getBytes(), mimeType: "application/pdf" }],
    });
    return "Email enviado a " + destinatario;
  } catch (e) {
    throw new Error("Error al enviar email: " + e.message);
  }
}

function obtenerResumenLiquidacion(liquidacionId) {
  var gastos = obtenerFilasFiltradas(obtenerHoja("Gastos"), "liquidacionId", liquidacionId);
  var fletes = obtenerFilasFiltradas(obtenerHoja("Fletes"), "liquidacionId", liquidacionId);
  var totalGastos = calcularTotalGastos(gastos);
  var totalFletes = calcularTotalFletes(fletes);
  var balance = calcularBalance(fletes, gastos);
  var totalPorDia = {};
  var diasSet = {};
  for (var i = 0; i < gastos.length; i++) { diasSet[gastos[i].diaSemana] = true; }
  var dias = Object.keys(diasSet);
  for (var d = 0; d < dias.length; d++) { totalPorDia[dias[d]] = calcularTotalPorDia(gastos, dias[d]); }
  return { totalGastos: totalGastos, totalFletes: totalFletes, balance: balance, totalPorDia: totalPorDia, gastos: gastos, fletes: fletes };
}

function compararLiquidaciones(idA, idB) {
  var resumenA = obtenerResumenLiquidacion(idA);
  var resumenB = obtenerResumenLiquidacion(idB);
  var balanceA = calcularBalance(resumenA.totalFletes > 0 ? [{ monto: resumenA.totalFletes }] : [], [{ monto: resumenA.totalGastos }]);
  var balanceB = calcularBalance(resumenB.totalFletes > 0 ? [{ monto: resumenB.totalFletes }] : [], [{ monto: resumenB.totalGastos }]);
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
  for (var i = 0; i < configFilas.length; i++) { config[configFilas[i].clave] = configFilas[i].valor; }
  return detectarAlertasMantenimiento(vehiculo, config, new Date().toISOString().split("T")[0]);
}

function obtenerPlacaActiva() {
  var liq = obtenerLiquidacionAbierta();
  return liq ? liq.placa : null;
}

function preguntarIA(pregunta, liquidacionId) {
  throw new Error("Gemini Flash no configurado. Pendiente de Fase 5.");
}

function verificarPIN(pin) {
  var prop = PropertiesService.getScriptProperties();
  var pinGuardado = prop.getProperty("PIN");
  if (!pinGuardado) { prop.setProperty("PIN", pin); return true; }
  return pinGuardado === pin;
}

function obtenerLiquidacionAbierta() {
  var hoja = obtenerHoja("Liquidaciones");
  var filas = leerFilas(hoja, 2);
  for (var i = 0; i < filas.length; i++) { if (filas[i].estado === "abierta") return filas[i]; }
  return null;
}