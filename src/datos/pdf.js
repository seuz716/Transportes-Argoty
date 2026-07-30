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
  var bal = totalFletes - totalGastos;

  body.appendTable([
    ["Concepto", "Monto"],
    ["Total fletes (ingresos)", "$" + totalFletes.toLocaleString("es-CO")],
    ["Total gastos", "$" + totalGastos.toLocaleString("es-CO")],
    ["BALANCE", bal >= 0 ? "$" + bal.toLocaleString("es-CO") : "-$" + Math.abs(bal).toLocaleString("es-CO")],
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

if (typeof module !== "undefined") {
  module.exports = { generarPDFLiquidacion };
}