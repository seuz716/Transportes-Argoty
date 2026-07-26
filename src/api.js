function crearLiquidacion(placa, fechaInicio, kmInicial) {
  const hoja = obtenerHoja("Liquidaciones");
  const id = obtenerProximoId(hoja);
  const liquidacion = {
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
  const hoja = obtenerHoja("Gastos");
  const id = obtenerProximoId(hoja);
  const gasto = {
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
  const hoja = obtenerHoja("Fletes");
  const id = obtenerProximoId(hoja);
  const flete = {
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
  const hojaLiq = obtenerHoja("Liquidaciones");
  const liqFilas = leerFilas(hojaLiq, 2);
  let idx = -1;
  for (let i = 0; i < liqFilas.length; i++) {
    if (liqFilas[i].id === liquidacionId) { idx = i; break; }
  }
  if (idx === -1) throw new Error("Liquidacion " + liquidacionId + " no encontrada");

  const gastos = obtenerFilasFiltradas(obtenerHoja("Gastos"), "liquidacionId", liquidacionId);
  const fletes = obtenerFilasFiltradas(obtenerHoja("Fletes"), "liquidacionId", liquidacionId);

  const totalGastos = calcularTotalGastos(gastos);
  const totalFletes = calcularTotalFletes(fletes);
  const balance = calcularBalance(fletes, gastos);

  let totalACPM = 0;
  for (let j = 0; j < gastos.length; j++) {
    if (gastos[j].categoria === "ACPM") totalACPM += gastos[j].monto;
  }
  const consumoKm = calcularConsumoPorKm(totalACPM, liqFilas[idx].kmInicial, kmFinal);

  liqFilas[idx].fechaFin = new Date().toISOString().split("T")[0];
  liqFilas[idx].kmFinal = kmFinal;
  liqFilas[idx].estado = "cerrada";
  liqFilas[idx].totalGastos = totalGastos;
  liqFilas[idx].totalFletes = totalFletes;
  liqFilas[idx].balance = balance;
  liqFilas[idx].consumoKm = consumoKm;

  const valores = Object.values(liqFilas[idx]);
  hojaLiq.getRange(idx + 2, 1, 1, valores.length).setValues([valores]);

  let pdfUrl = "";
  try {
    pdfUrl = generarPDFLiquidacion(liquidacionId, liqFilas[idx], fletes, gastos);
    liqFilas[idx].pdfUrl = pdfUrl;
    const v2 = Object.values(liqFilas[idx]);
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
  const doc = DocumentApp.create("Liquidacion " + liquidacionId);
  const body = doc.getBody();

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

  const dias = {};
  gastos.forEach(function(g) {
    if (!dias[g.diaSemana]) dias[g.diaSemana] = [];
    dias[g.diaSemana].push(g);
  });

  const diasOrden = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  diasOrden.forEach(function(dia) {
    const items = dias[dia];
    if (!items || items.length === 0) return;
    body.appendParagraph(dia).setBold(true).setFontSize(11);
    items.forEach(function(item) {
      body.appendParagraph(
          "  " + item.descripcion + " - $" + item.monto.toLocaleString("es-CO") +
          " [" + item.categoria + "]"
      ).setFontSize(10);
    });
    const subtotal = items.reduce(function(s, i) { return s + i.monto; }, 0);
    body.appendParagraph("  Subtotal: $" + subtotal.toLocaleString("es-CO"))
        .setFontSize(10).setBold(true);
  });

  const adicionales = gastos.filter(function(g) { return g.esAdicional; });
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

  const totalFletes = fletes.reduce(function(s, f) { return s + f.monto; }, 0);
  const totalGastos = gastos.reduce(function(s, g) { return s + g.monto; }, 0);
  const bal = totalFletes - totalGastos;

  body.appendTable([
    ["Concepto", "Monto"],
    ["Total fletes (ingresos)", "$" + totalFletes.toLocaleString("es-CO")],
    ["Total gastos", "$" + totalGastos.toLocaleString("es-CO")],
    ["BALANCE", bal >= 0 ? "$" + bal.toLocaleString("es-CO") : "-$" + Math.abs(bal).toLocaleString("es-CO")],
  ]).setFontSize(10);

  const pdfBlob = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF);
  const pdfName = "Liquidacion_" + liquidacionId + ".pdf";
  const folderId = PropertiesService.getScriptProperties().getProperty("PDF_FOLDER");
  let pdfFile;
  if (folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
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
  const mensaje = "Liquidacion " + liquidacionId + " completada. Balance: $" + balance.toLocaleString("es-CO") + ". PDF: " + pdfUrl;
  return "https://wa.me/?text=" + encodeURIComponent(mensaje);
}

function enviarPorEmail(destinatario, asunto, cuerpo, pdfUrl) {
  try {
    const response = UrlFetchApp.fetch(pdfUrl);
    const pdfBlob = response.getBlob().setName("Liquidacion.pdf");
    GmailApp.sendEmail(destinatario, asunto, cuerpo, {
      attachments: [{ fileName: "Liquidacion.pdf", content: pdfBlob.getBytes(), mimeType: "application/pdf" }],
    });
    return "Email enviado a " + destinatario;
  } catch (e) {
    throw new Error("Error al enviar email: " + e.message);
  }
}

function obtenerResumenLiquidacion(liquidacionId) {
  const gastos = obtenerFilasFiltradas(obtenerHoja("Gastos"), "liquidacionId", liquidacionId);
  const fletes = obtenerFilasFiltradas(obtenerHoja("Fletes"), "liquidacionId", liquidacionId);
  const totalGastos = calcularTotalGastos(gastos);
  const totalFletes = calcularTotalFletes(fletes);
  const balance = calcularBalance(fletes, gastos);
  const totalPorDia = {};
  const diasSet = {};
  for (let i = 0; i < gastos.length; i++) { diasSet[gastos[i].diaSemana] = true; }
  const dias = Object.keys(diasSet);
  for (let d = 0; d < dias.length; d++) { totalPorDia[dias[d]] = calcularTotalPorDia(gastos, dias[d]); }
  return { totalGastos: totalGastos, totalFletes: totalFletes, balance: balance, totalPorDia: totalPorDia, gastos: gastos, fletes: fletes };
}

function compararLiquidaciones(idA, idB) {
  const resumenA = obtenerResumenLiquidacion(idA);
  const resumenB = obtenerResumenLiquidacion(idB);
  const balanceA = calcularBalance(resumenA.totalFletes > 0 ? [{ monto: resumenA.totalFletes }] : [], [{ monto: resumenA.totalGastos }]);
  const balanceB = calcularBalance(resumenB.totalFletes > 0 ? [{ monto: resumenB.totalFletes }] : [], [{ monto: resumenB.totalGastos }]);
  let ganador = null;
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
  const vehiculo = obtenerFilasFiltradas(obtenerHoja("Vehiculo"), "placa", obtenerPlacaActiva())[0];
  if (!vehiculo) return [];
  const config = {};
  const configFilas = leerFilas(obtenerHoja("Config"), 2);
  for (let i = 0; i < configFilas.length; i++) { config[configFilas[i].clave] = configFilas[i].valor; }
  return detectarAlertasMantenimiento(vehiculo, config, new Date().toISOString().split("T")[0]);
}

function obtenerPlacaActiva() {
  const liq = obtenerLiquidacionAbierta();
  return liq ? liq.placa : null;
}

function preguntarIA(pregunta, liquidacionId) {
  throw new Error("Gemini Flash no configurado. Pendiente de Fase 5.");
}

function verificarPIN(pin) {
  const prop = PropertiesService.getScriptProperties();
  const pinGuardado = prop.getProperty("PIN");
  if (!pinGuardado) { prop.setProperty("PIN", pin); return true; }
  return pinGuardado === pin;
}

function obtenerLiquidacionAbierta() {
  const hoja = obtenerHoja("Liquidaciones");
  const filas = leerFilas(hoja, 2);
  for (let i = 0; i < filas.length; i++) { if (filas[i].estado === "abierta") return filas[i]; }
  return null;
}