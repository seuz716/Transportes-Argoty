const {
  calcularTotalPorDia,
  calcularTotalGastos,
  calcularTotalFletes,
  calcularBalance,
  calcularConsumoPorKm,
  detectarAlertasMantenimiento,
  compararLiquidaciones,
  sugerirMontoPorCategoria,
  formatearContextoParaIA,
} = require("../src/logica/calculos");
const {
  gastosSAV792,
  fletesSAV792,
  gastosAdicionales,
  gastosDelDia,
  vehiculoEjemplo,
  configEjemplo,
  historicoUltimos3Viajes,
} = require("./fixtures/viajes");

describe("calcularTotalPorDia", () => {
  test("suma los montos de un día específico", () => {
    expect(calcularTotalPorDia(gastosSAV792, "Lunes")).toBe(125000);
  });

  test("suma los montos de Martes incluyendo peajes", () => {
    expect(calcularTotalPorDia(gastosSAV792, "Martes")).toBe(132000);
  });

  test("retorna 0 si no hay gastos para ese día", () => {
    expect(calcularTotalPorDia(gastosSAV792, "NoExiste")).toBe(0);
  });

  test("retorna 0 con gastos vacíos", () => {
    expect(calcularTotalPorDia([], "Lunes")).toBe(0);
  });
});

describe("calcularTotalGastos", () => {
  test("devuelve la suma de todos los montos de gastos", () => {
    expect(calcularTotalGastos(gastosSAV792)).toBe(931000);
  });

  test("retorna 0 con array vacío", () => {
    expect(calcularTotalGastos([])).toBe(0);
  });
});

describe("calcularTotalFletes", () => {
  test("devuelve la suma de todos los montos de fletes", () => {
    expect(calcularTotalFletes(fletesSAV792)).toBe(1000000);
  });

  test("retorna 0 con array vacío", () => {
    expect(calcularTotalFletes([])).toBe(0);
  });
});

describe("calcularBalance", () => {
  test("retorna fletes menos gastos para SAV792", () => {
    expect(calcularBalance(fletesSAV792, gastosSAV792)).toBe(69000);
  });

  test("devuelve 0 cuando fletes y gastos son iguales", () => {
    expect(calcularBalance(fletesSAV792, fletesSAV792)).toBe(0);
  });
});

describe("calcularConsumoPorKm", () => {
  test("calcula consumo por kilómetro", () => {
    expect(calcularConsumoPorKm(100000, 1000, 2000)).toBe(100);
  });

  test("retorna 0 si la distancia es 0", () => {
    expect(calcularConsumoPorKm(100000, 1000, 1000)).toBe(0);
  });

  test("calcula ACPM por km para SAV792", () => {
    const totalACPM = gastosSAV792
      .filter((g) => g.categoria === "ACPM")
      .reduce((sum, g) => sum + g.monto, 0);
    expect(calcularConsumoPorKm(totalACPM, 45000, 45600)).toBe(
      totalACPM / 600
    );
  });
});

describe("detectarAlertasMantenimiento", () => {
  test("detecta alerta de aceite por km recorridos", () => {
    const vehiculo = { ...vehiculoEjemplo, kmActual: 45600, kmUltimoAceite: 42000 };
    const alertas = detectarAlertasMantenimiento(vehiculo, configEjemplo, "2026-07-26");
    expect(alertas).toContain("Cambio de aceite");
  });

  test("no detecta alerta de aceite cuando está al día", () => {
    const vehiculo = { ...vehiculoEjemplo, kmActual: 44000, kmUltimoAceite: 42000 };
    const alertas = detectarAlertasMantenimiento(vehiculo, configEjemplo, "2026-07-26");
    expect(alertas).not.toContain("Cambio de aceite");
  });

  test("detecta alerta de llantas por km recorridos", () => {
    const vehiculo = { ...vehiculoEjemplo, kmActual: 80000, kmUltimoCambioLlantas: 38000 };
    const alertas = detectarAlertasMantenimiento(vehiculo, configEjemplo, "2026-07-26");
    expect(alertas).toContain("Cambio de llantas");
  });

  test("detecta alerta de engrasado por días transcurridos", () => {
    const vehiculo = { ...vehiculoEjemplo, fechaUltimaEngrasada: "2026-05-01" };
    const alertas = detectarAlertasMantenimiento(vehiculo, configEjemplo, "2026-07-26");
    expect(alertas).toContain("Engrasado");
  });

  test("detecta alerta de revisión de frenos", () => {
    const vehiculo = { ...vehiculoEjemplo, fechaUltimaRevisionFrenos: "2026-03-20" };
    const alertas = detectarAlertasMantenimiento(vehiculo, configEjemplo, "2026-07-26");
    expect(alertas).toContain("Revisión de frenos");
  });

  test("retorna array vacío cuando no hay alertas", () => {
    const vehiculo = {
      ...vehiculoEjemplo,
      kmActual: 43000,
      kmUltimoAceite: 42000,
      kmUltimoCambioLlantas: 40500,
      fechaUltimaEngrasada: "2026-07-01",
      fechaUltimaRevisionFrenos: "2026-07-01",
    };
    const alertas = detectarAlertasMantenimiento(vehiculo, configEjemplo, "2026-07-26");
    expect(alertas).toEqual([]);
  });
});

describe("compararLiquidaciones", () => {
  test("compara dos liquidaciones y devuelve diferencias", () => {
    const a = { id: "A", totalGastos: 800000, totalFletes: 1000000, balance: 200000 };
    const b = { id: "B", totalGastos: 700000, totalFletes: 900000, balance: 200000 };
    const resultado = compararLiquidaciones(a, b);
    expect(resultado.balanceDiferencia).toBe(0);
    expect(resultado.gastosDiferencia).toBe(100000);
    expect(resultado.fletesDiferencia).toBe(100000);
  });

  test("indica cuál liquidación tiene mejor balance", () => {
    const a = { id: "A", balance: 150000 };
    const b = { id: "B", balance: 200000 };
    const resultado = compararLiquidaciones(a, b);
    expect(resultado.mejorBalance).toBe("B");
  });
});

describe("sugerirMontoPorCategoria", () => {
  test("retorna el último monto registrado para una categoría", () => {
    const historico = [
      { diaSemana: "Lunes", categoria: "ACPM", monto: 100000 },
      { diaSemana: "Martes", categoria: "ACPM", monto: 120000 },
      { diaSemana: "Miercoles", categoria: "Diario", monto: 5000 },
    ];
    expect(sugerirMontoPorCategoria("ACPM", historico)).toBe(120000);
  });

  test("retorna undefined si no hay historial para la categoría", () => {
    const historico = [{ diaSemana: "Lunes", categoria: "Diario", monto: 5000 }];
    expect(sugerirMontoPorCategoria("ACPM", historico)).toBeUndefined();
  });
});

describe("formatearContextoParaIA", () => {
  test("incluye datos de la liquidación actual", () => {
    const liquidacion = {
      id: "SAV792",
      fechaInicio: "2026-07-20",
      fechaFin: "2026-07-26",
      totalGastos: 931000,
      totalFletes: 1000000,
      balance: 69000,
      categoriaMasGasto: "ACPM",
    };
    const vehiculo = { placa: "ABC-123", kmActual: 45600 };
    const resultado = formatearContextoParaIA(liquidacion, historicoUltimos3Viajes, vehiculo);
    expect(resultado).toContain("SAV792");
    expect(resultado).toContain("931000");
    expect(resultado).toContain("1000000");
    expect(resultado).toContain("69000");
  });

  test("incluye historico de viajess anteriores", () => {
    const liquidacion = {
      id: "SAV792",
      totalGastos: 931000,
      totalFletes: 1000000,
      balance: 69000,
      categoriaMasGasto: "ACPM",
    };
    const vehiculo = { placa: "ABC-123", kmActual: 45600 };
    const resultado = formatearContextoParaIA(liquidacion, historicoUltimos3Viajes, vehiculo);
    expect(resultado).toContain("SAV780");
    expect(resultado).toContain("SAV785");
  });

  test("incluye estado del vehículo", () => {
    const liquidacion = {
      id: "SAV792",
      totalGastos: 931000,
      totalFletes: 1000000,
      balance: 69000,
      categoriaMasGasto: "ACPM",
    };
    const vehiculo = { placa: "ABC-123", kmActual: 45600 };
    const resultado = formatearContextoParaIA(liquidacion, historicoUltimos3Viajes, vehiculo);
    expect(resultado).toContain("ABC-123");
    expect(resultado).toContain("45600");
  });
});

// Test de integración con el fixture real de SAV792
describe("integración SAV792", () => {
  test("el balance calculado coincide con el resultado esperado", () => {
    const fletes = calcularTotalFletes(fletesSAV792);
    const gastos = calcularTotalGastos(gastosSAV792);
    const balance = calcularBalance(fletesSAV792, gastosSAV792);
    expect(fletes).toBe(1000000);
    expect(gastos).toBe(931000);
    expect(balance).toBe(69000);
  });

  test("el gasto del día Lunes se calcula correctamente sin adicionales", () => {
    expect(calcularTotalPorDia(gastosSAV792, "Lunes")).toBe(125000);
  });
});