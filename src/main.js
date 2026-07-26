function doGet() {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("Liquidación de Fletes")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}