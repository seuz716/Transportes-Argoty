function generarPDF(liquidacionId, datos, fletes, gastos) {
  var doc = DocumentApp.create("Liquidacion " + liquidacionId);
  var body = doc.getBody();

  body.appendParagraph("LIQUIDACIÓN DE FLETES")
      .setHeading(DocumentApp.ParagraphHeading.HEADING1)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph("Viaje " + liquidacionId)
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

  body.appendParagraph(
      "Fecha inicio: " + datos.fechaInicio +
      " | Fecha fin: " + (datos.fechaFin || new Date().toISOString().split("T")[0])
  ).setFontSize(10);

  body.appendParagraph(
      "Vehículo: " + datos.placa +
      " | Km " + datos.kmInicial + " → " + datos.kmFinal +
      " (" + (datos.kmFinal - datos.kmInicial) + " km)"
  ).setFontSize(10);

  if (datos.consumoKm) {
    body.appendParagraph("Consumo ACPM: $" + datos.consumoKm.toFixed(2) + "/km")
        .setFontSize(10);
  }

  body.appendParagraph("")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2)
      .setText(" Gastos del día");

  var dias = {};
  gastos.forEach(function(g) {
    if (!dias[g.diaSemana]) dias[g.diaSemana] = [];
    dias[g.diaSemana].push(g);
  });

  var diasOrden = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  var totalGeneral = 0;

  diasOrden.forEach(function(dia) {
    var items = dias[dia];
    if (!items || items.length === 0) return;
    body.appendParagraph(dia).setBold(true).setFontSize(11);
    items.forEach(function(item) {
      body.appendParagraph(
          "  " + item.descripcion + " — $" + item.monto.toLocaleString("es-CO") +
          " [" + item.categoria + "]"
      ).setFontSize(10);
      totalGeneral += item.monto;
    });
    var subtotal = items.reduce(function(s, i) { return s + i.monto; }, 0);
    body.appendParagraph("  Subtotal: $" + subtotal.toLocaleString("es-CO"))
        .setFontSize(10)
        .setBold(true);
  });

  var adicionales = gastos.filter(function(g) { return g.esAdicional; });
  if (adicionales.length > 0) {
    body.appendParagraph("")
        .setHeading(DocumentApp.ParagraphHeading.HEADING2)
        .setText(" Gastos adicionales");
    adicionales.forEach(function(item) {
      body.appendParagraph(
          "  " + item.descripcion + " — $" + item.monto.toLocaleString("es-CO") +
          " [" + item.categoria + "]"
      ).setFontSize(10);
      totalGeneral += item.monto;
    });
  }

  body.appendParagraph("")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2)
      .setText("Resumen financiero");

  var totalFletes = fletes.reduce(function(s, f) { return s + f.monto; }, 0);
  var totalGastos = gastos.reduce(function(s, g) { return s + g.monto; }, 0);
  var balance = totalFletes - totalGastos;

  body.appendTable([
    ["Concepto", "Monto"],
    ["Total fletes (ingresos)", "$" + totalFletes.toLocaleString("es-CO")],
    ["Total gastos", "$" + totalGastos.toLocaleString("es-CO")],
    ["BALANCE", balance >= 0 ? "$" + balance.toLocaleString("es-CO") : "-$" + Math.abs(balance).toLocaleString("es-CO")],
  ]).setFontSize(10);

  var pdfFile = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF);
  var pdfBlob = pdfFile.getBlob();
  var folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("PDF_FOLDER") || "root");
  var pdfFileSaved = folder.createFile(pdfBlob).setName("Liquidacion_" + liquidacionId + ".pdf");

  doc.setTrashed(true);

  return pdfFileSaved.getUrl();
}

function enviarPorWhatsApp(liquidacionId, pdfUrl, balance) {
  var mensaje = "Liquidación " + liquidacionId + " completada. Balance: $" + balance.toLocaleString("es-CO") + ". PDF: " + pdfUrl;
  return "https://wa.me/?text=" + encodeURIComponent(mensaje);
}

function enviarPorEmail(to, asunto, cuerpo, pdfUrl) {
  GmailApp.sendEmail(to, asunto, cuerpo, {
    attachments: [
      {
        fileName: "Liquidacion.pdf",
        content: UrlFetchApp.fetch(pdfUrl).getBlob().getBytes(),
        mimeType: "application/pdf",
      },
    ],
  });
}

module.exports = {
  generarPDF,
  enviarPorWhatsApp,
  enviarPorEmail,
};