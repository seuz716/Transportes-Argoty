function doGet() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("SPREADSHEET_ID")) {
    throw new Error("SPREADSHEET_ID no configurado en PropertiesService. Ejecute setupInicial desde la consola de Apps Script.");
  }
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("Liquidación de Fletes")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
