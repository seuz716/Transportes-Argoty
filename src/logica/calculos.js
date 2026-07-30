function calcularTotalPorDia(gastos, dia) {
  return gastos
    .filter((g) => g.diaSemana === dia)
    .reduce((sum, g) => sum + g.monto, 0);
}

function calcularTotalGastos(gastos) {
  return gastos.reduce((sum, g) => sum + g.monto, 0);
}

function calcularTotalFletes(fletes) {
  return fletes.reduce((sum, f) => sum + f.monto, 0);
}

function calcularBalance(fletes, gastos) {
  return calcularTotalFletes(fletes) - calcularTotalGastos(gastos);
}

function calcularConsumoPorKm(totalACPM, kmInicial, kmFinal) {
  const distancia = kmFinal - kmInicial;
  if (distancia <= 0) return 0;
  return totalACPM / distancia;
}

function detectarAlertasMantenimiento(vehiculo, config, fechaHoy) {
  const hoy = new Date(fechaHoy);
  const alertas = [];

  const kmRecorridoAceite = vehiculo.kmActual - vehiculo.kmUltimoAceite;
  if (kmRecorridoAceite > config.kmEntreCambioAceite) {
    alertas.push("Cambio de aceite");
  }

  const kmRecorridoLlantas = vehiculo.kmActual - vehiculo.kmUltimoCambioLlantas;
  if (kmRecorridoLlantas > config.kmVidaLlantas) {
    alertas.push("Cambio de llantas");
  }

  const diasDesdeEngrasada = Math.floor(
    (hoy - new Date(vehiculo.fechaUltimaEngrasada)) / (1000 * 60 * 60 * 24)
  );
  if (diasDesdeEngrasada > config.diasEntreEngrasadas) {
    alertas.push("Engrasado");
  }

  const diasDesdeFrenos = Math.floor(
    (hoy - new Date(vehiculo.fechaUltimaRevisionFrenos)) / (1000 * 60 * 60 * 24)
  );
  if (diasDesdeFrenos > config.diasEntreRevisionFrenos) {
    alertas.push("Revisión de frenos");
  }

  return alertas;
}

function compararLiquidaciones(liquidacionA, liquidacionB) {
  const balanceA = liquidacionA.balance;
  const balanceB = liquidacionB.balance;

  let mejorBalance = null;
  if (balanceA > balanceB) mejorBalance = liquidacionA.id;
  else if (balanceB > balanceA) mejorBalance = liquidacionB.id;
  else mejorBalance = "empate";

  return {
    balanceDiferencia: Math.abs(balanceA - balanceB),
    gastosDiferencia: Math.abs(liquidacionA.totalGastos - liquidacionB.totalGastos),
    fletesDiferencia: Math.abs(liquidacionA.totalFletes - liquidacionB.totalFletes),
    mejorBalance,
  };
}

function sugerirMontoPorCategoria(categoria, historicoGastos) {
  const ultimo = [...historicoGastos].reverse().find((g) => g.categoria === categoria);
  return ultimo ? ultimo.monto : undefined;
}

function formatearContextoParaIA(liquidacionActual, historico, vehiculo) {
  const lineas = [
    `Viaje ${liquidacionActual.id}: ${liquidacionActual.fechaInicio} a ${liquidacionActual.fechaFin}.`,
    `Gastos totales: $${liquidacionActual.totalGastos}. Fletes totales: $${liquidacionActual.totalFletes}. Balance: $${liquidacionActual.balance}.`,
    `Categoría con mayor gasto: ${liquidacionActual.categoriaMasGasto}.`,
    `Vehículo: ${vehiculo.placa}, km actual: ${vehiculo.kmActual}.`,
  ];

  if (historico && historico.length > 0) {
    lineas.push("Últimos viajes:");
  historico.forEach((v) => {
    var detalle = `  Viaje ${v.id}: balance $${v.balance}, total gasto $${v.totalGastos}, total fletes $${v.totalFletes}`;
    if (v.categoriaMasGasto) {
      detalle += `, gasto más alto en ${v.categoriaMasGasto} ($${v.montoMasGasto})`;
    }
    lineas.push(detalle + ".");
  });
  }

  return lineas.join("\n");
}

if (typeof module !== "undefined") {
  module.exports = {
    calcularTotalPorDia,
    calcularTotalGastos,
    calcularTotalFletes,
    calcularBalance,
    calcularConsumoPorKm,
    detectarAlertasMantenimiento,
    compararLiquidaciones,
    sugerirMontoPorCategoria,
    formatearContextoParaIA,
  };
}