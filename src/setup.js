/**
 * Script de configuración inicial para Transportes Argoty
 * Ejecutar en consola de Apps Script o como función de desarrollo
 */

function setupInicial() {
  // Configuración por defecto - MODIFICAR con valores reales
  const SPREADSHEET_ID = "TU_SPREADSHEET_ID_AQUI"; // Reemplazar con ID real
  const PIN_INICIAL = "123456"; // PIN de desarrollo
  
  // Guardar en PropertiesService (persistente)
  const props = PropertiesService.getScriptProperties();
  
  props.setProperty("SPREADSHEET_ID", SPREADSHEET_ID);
  props.setProperty("PIN", PIN_INICIAL);
  props.setProperty("PDF_FOLDER", ""); // Vacío = raíz de Drive
  
  // Crear hoja de Config con valores por defecto
  try {
    const hojaConfig = obtenerHoja("Config");
    
    const configDefaults = [
      ["clave", "valor"],
      ["diasEntreEngrasadas", "30"],
      ["kmEntreCambioAceite", "3000"],
      ["diasEntreRevisionFrenos", "90"],
      ["kmVidaLlantas", "40000"]
    ];
    
    if (hojaConfig.getLastRow() < 5) {
      hojaConfig.getRange(1, 1, configDefaults.length, 2).setValues(configDefaults);
    }
    
    // Crear hoja Vehiculo con un placeholder
    const hojaVehiculo = obtenerHoja("Vehiculo");
    if (hojaVehiculo.getLastRow() < 2) {
      const vehiculoPlaceholder = {
        placa: "CONFIGURAR_AQUI",
        kmActual: 0,
        fechaUltimoAceite: new Date().toISOString().split("T")[0],
        kmUltimoAceite: 0,
        fechaUltimaEngrasada: new Date().toISOString().split("T")[0],
        fechaUltimaRevisionFrenos: new Date().toISOString().split("T")[0],
        fechaUltimoCambioLlantas: new Date().toISOString().split("T")[0],
        kmUltimoCambioLlantas: 0
      };
      agregarFila(hojaVehiculo, vehiculoPlaceholder);
    }
    
    Logger.log("✅ Configuración inicial completada");
    Logger.log("📝 Próximos pasos:");
    Logger.log("   1. Reemplazar SPREADSHEET_ID en este script con el real");
    Logger.log("   2. Actualizar datos del vehiculo en hoja 'Vehiculo'");
    Logger.log("   3. Hacer deploy de la app web");
    
  } catch (e) {
    Logger.log("❌ Error en setup: " + e.message);
  }
}

function eliminarSetup() {
  // Limpiar configuración (para desarrollo)
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty("SPREADSHEET_ID");
  props.deleteProperty("PIN");
  props.deleteProperty("PDF_FOLDER");
  Logger.log("✅ Configuración eliminada");
}

// Para verificar configuración actual
function verConfiguracion() {
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log("Configuración actual:");
  for (const key in props) {
    const value = key === "PIN" ? "***" : props[key];
    Logger.log(`  ${key}: ${value}`);
  }
}