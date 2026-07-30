// ==================== Session ====================

function verificarSesion(token) {
  if (!token) throw new Error("Sesion no valida");
  var cache = CacheService.getScriptCache();
  if (!cache.get("session_" + token)) throw new Error("Sesion expirada. Ingrese el PIN nuevamente.");
}

function resolverLiquidacionId(liquidacionId) {
  if (liquidacionId === "current") {
    var liq = obtenerLiquidacionAbierta();
    if (!liq) throw new Error("No hay liquidacion abierta");
    return liq.id;
  }
  if (liquidacionId === "previous") {
    var hoja = obtenerHoja("Liquidaciones");
    var filas = leerFilas(hoja, 2);
    var cerradas = filas
      .filter(function(f) { return f.estado === "cerrada"; })
      .sort(function(a, b) { return Number(b.id) - Number(a.id); });
    if (cerradas.length === 0) throw new Error("No hay viajes cerrados");
    return cerradas[0].id;
  }
  return liquidacionId;
}

function buscarLiquidacion(liquidacionId) {
  var hoja = obtenerHoja("Liquidaciones");
  var filas = leerFilas(hoja, 2);
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i].id) === String(liquidacionId)) return filas[i];
  }
  return null;
}

function obtenerLiquidacionAbierta() {
  var hoja = obtenerHoja("Liquidaciones");
  var filas = leerFilas(hoja, 2);
  for (var i = 0; i < filas.length; i++) {
    if (filas[i].estado === "abierta") return filas[i];
  }
  return null;
}

// ==================== PIN ====================

function verificarPIN(pin) {
  var prop = PropertiesService.getScriptProperties();
  var pinGuardado = prop.getProperty("PIN");
  if (!pinGuardado) {
    prop.setProperty("PIN", pin);
  } else if (pinGuardado !== pin) {
    return false;
  }
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put("session_" + token, "1", 21600);
  return token;
}

// ==================== Resumen (interno) ====================

function _obtenerResumenLiquidacion(liquidacionId) {
  var resolvedId = resolverLiquidacionId(liquidacionId);
  var cacheKey = "resumen_" + resolvedId;
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  var liq = buscarLiquidacion(resolvedId);
  var gastos = obtenerFilasFiltradas(obtenerHoja("Gastos"), "liquidacionId", resolvedId);
  var fletes = obtenerFilasFiltradas(obtenerHoja("Fletes"), "liquidacionId", resolvedId);
  var totalGastos = calcularTotalGastos(gastos);
  var totalFletes = calcularTotalFletes(fletes);
  var balance = calcularBalance(fletes, gastos);
  
  // Calcular totales por día, excluyendo gastos adicionales (que no tienen día)
  var totalPorDia = {};
  var diasSet = {};
  for (var i = 0; i < gastos.length; i++) {
    var dia = gastos[i].diaSemana;
    if (dia) {
      diasSet[dia] = true;
    }
  }
  var dias = Object.keys(diasSet);
  for (var d = 0; d < dias.length; d++) { 
    totalPorDia[dias[d]] = calcularTotalPorDia(gastos, dias[d]); 
  }
  
  var resultado = {
    id: resolvedId,
    placa: liq ? liq.placa : "",
    kmInicial: liq ? liq.kmInicial : 0,
    totalGastos: totalGastos,
    totalFletes: totalFletes,
    balance: balance,
    totalPorDia: totalPorDia,
    gastos: gastos,
    fletes: fletes
  };
  cache.put(cacheKey, JSON.stringify(resultado), 10);
  return resultado;
}

// ==================== Liquidaciones (public) ====================

function crearLiquidacion(placa, fechaInicio, kmInicial, conductor, token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Liquidaciones");
  var id = obtenerProximoId(hoja);
  var liquidacion = {
    id: String(id),
    placa: placa,
    conductor: conductor || "",
    fechaInicio: fechaInicio,
    fechaFin: null,
    kmInicial: kmInicial,
    kmFinal: null,
    estado: "abierta",
    totalGastos: 0,
    totalFletes: 0,
    balance: 0,
    consumoKm: 0,
    pdfUrl: "",
  };
  agregarFila(hoja, liquidacion);
  return liquidacion;
}

function obtenerResumenLiquidacion(liquidacionId, token) {
  verificarSesion(token);
  return _obtenerResumenLiquidacion(liquidacionId);
}

function cerrarLiquidacion(liquidacionId, kmFinal, token) {
  verificarSesion(token);
  var resolvedId = resolverLiquidacionId(liquidacionId);
  var hojaLiq = obtenerHoja("Liquidaciones");
  var liqFilas = leerFilas(hojaLiq, 2);
  var idx = -1;
  for (var i = 0; i < liqFilas.length; i++) {
    if (String(liqFilas[i].id) === String(resolvedId)) { idx = i; break; }
  }
  if (idx === -1) throw new Error("Liquidacion " + resolvedId + " no encontrada");

  var kmInicial = liqFilas[idx].kmInicial;
  if (Number(kmFinal) <= Number(kmInicial)) {
    throw new Error("kmFinal (" + kmFinal + ") debe ser mayor que kmInicial (" + kmInicial + ")");
  }

  var placa = liqFilas[idx].placa;
  var vehiculo = obtenerFilasFiltradas(obtenerHoja("Vehiculo"), "placa", placa)[0];
  if (vehiculo && Number(kmFinal) < Number(vehiculo.kmActual)) {
    throw new Error("kmFinal (" + kmFinal + ") no puede ser menor que el km actual del vehiculo (" + vehiculo.kmActual + ")");
  }

  var gastos = obtenerFilasFiltradas(obtenerHoja("Gastos"), "liquidacionId", resolvedId);
  var fletes = obtenerFilasFiltradas(obtenerHoja("Fletes"), "liquidacionId", resolvedId);

  var totalGastos = calcularTotalGastos(gastos);
  var totalFletes = calcularTotalFletes(fletes);
  var balance = calcularBalance(fletes, gastos);

  function _invalidarCacheResumen(liquidacionId) {
  CacheService.getScriptCache().remove("resumen_" + liquidacionId);
}

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
    pdfUrl = generarPDFLiquidacion(resolvedId, liqFilas[idx], fletes, gastos);
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

function compararLiquidaciones(idA, idB, token) {
  verificarSesion(token);
  var resumenA = _obtenerResumenLiquidacion(idA);
  var resumenB = _obtenerResumenLiquidacion(idB);
  return {
    balanceA: resumenA.balance,
    balanceB: resumenB.balance,
    gastosA: resumenA.totalGastos,
    gastosB: resumenB.totalGastos,
    fletesA: resumenA.totalFletes,
    fletesB: resumenB.totalFletes,
    idA: resumenA.id,
    idB: resumenB.id,
  };
}

// ==================== Gastos / Fletes ====================

function agregarGasto(liquidacionId, categoria, descripcion, monto, fecha, esAdicional, token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Gastos");
  var id = obtenerProximoId(hoja);
  
  // Para gastos adicionales, la fecha puede estar vacía
  var fechaNormalizada = fecha || "";
  var diaSemana = "";
  
  if (fecha && !esAdicional) {
    try {
      diaSemana = new Date(fecha).toLocaleDateString("es-CO", { weekday: "long" });
    } catch (e) {
      diaSemana = "";
    }
  }
  
  var gasto = {
    id: String(id),
    liquidacionId: liquidacionId,
    fecha: fechaNormalizada,
    diaSemana: diaSemana,
    categoria: categoria,
    descripcion: descripcion,
    monto: monto,
    esAdicional: esAdicional || false,
  };
  agregarFila(hoja, gasto);
  _invalidarCacheResumen(liquidacionId);
  return gasto;
}

function editarGasto(id, categoria, descripcion, monto, fecha, esAdicional, token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Gastos");
  
  var fechaNormalizada = fecha || "";
  var diaSemana = "";
  
  if (fecha && !esAdicional) {
    try {
      diaSemana = new Date(fecha).toLocaleDateString("es-CO", { weekday: "long" });
    } catch (e) {
      diaSemana = "";
    }
  }
  
  var datos = {
    categoria: categoria,
    descripcion: descripcion,
    monto: monto,
    fecha: fechaNormalizada,
    diaSemana: diaSemana,
    esAdicional: esAdicional || false,
  };
  var filasGastos = leerFilas(hoja, 2);
  var gastoExistente = filasGastos.find(function(f) { return String(f.id) === String(id); });
  if (gastoExistente) _invalidarCacheResumen(gastoExistente.liquidacionId);
  return editarFila(hoja, "id", id, datos);
}

function eliminarGasto(id, token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Gastos");
  var filasGastos = leerFilas(hoja, 2);
  var gastoEliminar = filasGastos.find(function(f) { return String(f.id) === String(id); });
  if (gastoEliminar) _invalidarCacheResumen(gastoEliminar.liquidacionId);
  return eliminarFila(hoja, "id", id);
}

function agregarFlete(liquidacionId, concepto, cliente, tipoCarga, monto, token) {
  verificarSesion(token);
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
  _invalidarCacheResumen(liquidacionId);
  return flete;
}

function editarFlete(id, concepto, cliente, tipoCarga, monto, token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Fletes");
  var datos = {
    concepto: concepto,
    cliente: cliente,
    tipoCarga: tipoCarga,
    monto: monto,
  };
  var filasFletes = leerFilas(hoja, 2);
  var fleteExistente = filasFletes.find(function(f) { return String(f.id) === String(id); });
  if (fleteExistente) _invalidarCacheResumen(fleteExistente.liquidacionId);
  return editarFila(hoja, "id", id, datos);
}

function eliminarFlete(id, token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Fletes");
  var filasFletes = leerFilas(hoja, 2);
  var fleteEliminar = filasFletes.find(function(f) { return String(f.id) === String(id); });
  if (fleteEliminar) _invalidarCacheResumen(fleteEliminar.liquidacionId);
  return eliminarFila(hoja, "id", id);
}

function listarLiquidaciones(token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Liquidaciones");
  var filas = leerFilas(hoja, 2);
  return filas
    .filter(function(f) { return f.estado === "cerrada"; })
    .sort(function(a, b) { return Number(b.id) - Number(a.id); })
    .map(function(f) {
      return { id: f.id, placa: f.placa, fechaInicio: f.fechaInicio, fechaFin: f.fechaFin, balance: f.balance };
    });
}

// ==================== Categorias ====================

function obtenerCategorias(token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Categorias");
  var filas = leerFilas(hoja, 2);
  if (filas.length === 0) {
    return [
      {nombre: "Diario", orden: 1},
      {nombre: "ACPM", orden: 2},
      {nombre: "Peajes", orden: 3},
      {nombre: "Comision", orden: 4},
      {nombre: "Coteros", orden: 5},
      {nombre: "Descargue", orden: 6},
      {nombre: "Envarillada", orden: 7},
      {nombre: "Manifiesto", orden: 8},
      {nombre: "Mantenimiento", orden: 9},
      {nombre: "Otro", orden: 10}
    ];
  }
  return filas.sort(function(a, b) { return a.orden - b.orden; });
}

function obtenerMontosSugeridos(token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Gastos");
  var todas = leerFilas(hoja, 2);
  var sugeridos = {};
  for (var i = 0; i < todas.length; i++) {
    sugeridos[todas[i].categoria] = todas[i].monto;
  }
  return sugeridos;
}

// ==================== Vehiculo ====================

function obtenerEstadoVehiculo(token) {
  verificarSesion(token);
  var liq = obtenerLiquidacionAbierta();
  if (!liq) return [];
  var vehiculo = obtenerFilasFiltradas(obtenerHoja("Vehiculo"), "placa", liq.placa)[0];
  if (!vehiculo) return [];
  var config = {};
  var configFilas = leerFilas(obtenerHoja("Config"), 2);
  for (var i = 0; i < configFilas.length; i++) { config[configFilas[i].clave] = configFilas[i].valor; }
  return detectarAlertasMantenimiento(vehiculo, config, new Date().toISOString().split("T")[0]);
}

function obtenerKmActualVehiculo(token) {
  verificarSesion(token);
  var liq = obtenerLiquidacionAbierta();
  if (!liq) return 0;
  var vehiculo = obtenerFilasFiltradas(obtenerHoja("Vehiculo"), "placa", liq.placa)[0];
  return vehiculo ? Number(vehiculo.kmActual) : 0;
}

// ==================== WhatsApp / Email ====================

function construirWhatsAppUrl(liquidacionId, pdfUrl, token) {
  verificarSesion(token);
  var resumen = _obtenerResumenLiquidacion(liquidacionId);
  var mensaje = "Liquidacion " + resumen.id + " completada. Balance: $" + resumen.balance.toLocaleString("es-CO") + ". PDF: " + pdfUrl;
  return "https://wa.me/?text=" + encodeURIComponent(mensaje);
}

function enviarPorEmail(destinatario, asunto, cuerpo, pdfUrl, token) {
  verificarSesion(token);
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

// ==================== IA ====================

function obtenerHistoricoLiquidaciones(limit, excludeId) {
  var hoja = obtenerHoja("Liquidaciones");
  var filas = leerFilas(hoja, 2);
  var cerradas = filas
    .filter(function(f) { return f.estado === "cerrada"; })
    .sort(function(a, b) { return Number(b.id) - Number(a.id); });

  var historico = [];
  var count = 0;
  for (var i = 0; i < cerradas.length && count < limit; i++) {
    if (String(cerradas[i].id) === String(excludeId)) continue;
    historico.push({
      id: cerradas[i].id,
      balance: cerradas[i].balance || 0,
      totalGastos: cerradas[i].totalGastos || 0,
      totalFletes: cerradas[i].totalFletes || 0,
      consumoKm: cerradas[i].consumoKm || 0,
    });
    count++;
  }
  return historico;
}

function preguntarIA(pregunta, liquidacionId, token) {
  verificarSesion(token);
  var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada en PropertiesService");
  if (!pregunta || pregunta.trim().length === 0) throw new Error("La pregunta no puede estar vacia");

  var liquidacion = _obtenerResumenLiquidacion(liquidacionId);
  if (!liquidacion || !liquidacion.id) {
    throw new Error("No se encontro la liquidacion " + liquidacionId);
  }

  var maxGasto = { categoria: "", monto: 0 };
  (liquidacion.gastos || []).forEach(function(g) {
    if (g.monto > maxGasto.monto) {
      maxGasto = { categoria: g.categoria, monto: g.monto };
    }
  });
  liquidacion.categoriaMasGasto = maxGasto.categoria;
  liquidacion.montoMasGasto = maxGasto.monto;

  var vehiculo = obtenerFilasFiltradas(obtenerHoja("Vehiculo"), "placa", liquidacion.placa || "")[0] || {};
  var vehiculoInfo = { placa: vehiculo.placa || "N/A", kmActual: vehiculo.kmActual || 0 };
  var historico = obtenerHistoricoLiquidaciones(3, liquidacionId);
  var contexto = formatearContextoParaIA(liquidacion, historico, vehiculoInfo);
  var promptStr = "Contexto de la liquidacion:\n" + contexto + "\n\nPregunta: " + pregunta;

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      contents: [{ parts: [{ text: promptStr }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
    }),
    muteHttpExceptions: true,
  };
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
  var res = UrlFetchApp.fetch(url, options);
  var code = res.getResponseCode();
  if (code !== 200) {
    var errBody = JSON.parse(res.getContentText());
    var errMsg = errBody.error && errBody.error.message ? errBody.error.message : "HTTP " + code;
    throw new Error("Gemini error " + code + ": " + errMsg);
  }

  var body = JSON.parse(res.getContentText());
  var candidates = body.candidates;
  if (!candidates || candidates.length === 0) throw new Error("Gemini no devolvio respuesta");
  var content = candidates[0].content;
  if (!content || !content.parts || content.parts.length === 0) {
    throw new Error("Gemini devolvio respuesta vacia");
  }
  var text = content.parts[0].text;
  text = text.replace(/[\r\n]+/g, "\n").trim();
  return text;
}

// ==================== Bitacora ====================

function agregarBitacora(liquidacionId, nota, montoOpcional, token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Bitacora");
  var id = obtenerProximoId(hoja);
  var entry = {
    id: String(id),
    liquidacionId: liquidacionId,
    fecha: new Date().toISOString().split("T")[0],
    nota: nota,
    montoOpcional: montoOpcional || 0,
    convertidoAGasto: false,
  };
  agregarFila(hoja, entry);
  return entry;
}

function obtenerBitacora(liquidacionId, token) {
  verificarSesion(token);
  var hoja = obtenerHoja("Bitacora");
  var filas = leerFilas(hoja, 2);
  return filas.filter(function(f) { return String(f.liquidacionId) === String(liquidacionId); });
}

function convertirBitacoraAGasto(bitacoraId, categoria, token) {
  verificarSesion(token);
  var hojaBitacora = obtenerHoja("Bitacora");
  var filas = leerFilas(hojaBitacora, 2);
  var idx = -1;
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i].id) === String(bitacoraId)) { idx = i; break; }
  }
  if (idx === -1) throw new Error("Entrada de bitacora no encontrada");
  if (filas[idx].convertidoAGasto) throw new Error("Esta entrada ya fue convertida");

  var hojaGastos = obtenerHoja("Gastos");
  var id = obtenerProximoId(hojaGastos);
  var gasto = {
    id: String(id),
    liquidacionId: filas[idx].liquidacionId,
    fecha: filas[idx].fecha,
    diaSemana: new Date(filas[idx].fecha).toLocaleDateString("es-CO", { weekday: "long" }),
    categoria: categoria || "Otro",
    descripcion: filas[idx].nota,
    monto: filas[idx].montoOpcional || 0,
    esAdicional: !0,
  };
  agregarFila(hojaGastos, gasto);

  filas[idx].convertidoAGasto = true;
  hojaBitacora.getRange(idx + 2, 1, 1, Object.values(filas[idx]).length).setValues([Object.values(filas[idx])]);
  _invalidarCacheResumen(filas[idx].liquidacionId);

  return gasto;
}
