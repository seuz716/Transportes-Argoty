const gastosSAV792 = [
  { id: 1, diaSemana: "Lunes", categoria: "Diario", monto: 5000, esAdicional: false },
  { id: 2, diaSemana: "Lunes", categoria: "ACPM", monto: 120000, esAdicional: false },
  { id: 3, diaSemana: "Martes", categoria: "Diario", monto: 5000, esAdicional: false },
  { id: 4, diaSemana: "Martes", categoria: "ACPM", monto: 115000, esAdicional: false },
  { id: 5, diaSemana: "Martes", categoria: "Peajes", monto: 12000, esAdicional: false },
  { id: 6, diaSemana: "Miercoles", categoria: "Diario", monto: 5000, esAdicional: false },
  { id: 7, diaSemana: "Miercoles", categoria: "ACPM", monto: 130000, esAdicional: false },
  { id: 8, diaSemana: "Miercoles", categoria: "Comisión", monto: 8000, esAdicional: false },
  { id: 9, diaSemana: "Jueves", categoria: "Diario", monto: 5000, esAdicional: false },
  { id: 10, diaSemana: "Jueves", categoria: "ACPM", monto: 125000, esAdicional: false },
  { id: 11, diaSemana: "Viernes", categoria: "Diario", monto: 5000, esAdicional: false },
  { id: 12, diaSemana: "Viernes", categoria: "ACPM", monto: 110000, esAdicional: false },
  { id: 13, diaSemana: "Sabado", categoria: "Diario", monto: 5000, esAdicional: false },
  { id: 14, diaSemana: "Sabado", categoria: "ACPM", monto: 95000, esAdicional: false },
  { id: 15, diaSemana: "Domingo", categoria: "Diario", monto: 5000, esAdicional: false },
  { id: 16, diaSemana: "Domingo", categoria: "ACPM", monto: 110000, esAdicional: false },
  { id: 17, diaSemana: "Miercoles", categoria: "Coteros", monto: 25000, esAdicional: true },
  { id: 18, diaSemana: "Jueves", categoria: "Descargue", monto: 15000, esAdicional: true },
  { id: 19, diaSemana: "Viernes", categoria: "Envarillada", monto: 8000, esAdicional: true },
  { id: 20, diaSemana: "Sabado", categoria: "Manifiesto", monto: 5000, esAdicional: true },
  { id: 21, diaSemana: "Domingo", categoria: "Mantenimiento", monto: 15000, esAdicional: true },
  { id: 22, diaSemana: "Domingo", categoria: "Otro", monto: 3000, esAdicional: true },
];

const fletesSAV792 = [
  { id: 1, concepto: "Anticipo", cliente: "Ferretería del Sur", tipoCarga: "Arveja", monto: 350000 },
  { id: 2, concepto: "Pago total", cliente: "Cooperativa Nariño", tipoCarga: "Flores", monto: 520000 },
  { id: 3, concepto: "Viaje de retorno", cliente: "Transportes Cundinamarca", tipoCarga: "Tambores", monto: 130000 },
];

const gastosAdicionales = gastosSAV792.filter((g) => g.esAdicional);
const gastosDelDia = gastosSAV792.filter((g) => g.diaSemana === "Lunes");

const vehiculoEjemplo = {
  placa: "ABC-123",
  kmActual: 45600,
  fechaUltimoAceite: "2026-04-15",
  kmUltimoAceite: 42000,
  fechaUltimaEngrasada: "2026-05-01",
  fechaUltimaRevisionFrenos: "2026-03-20",
  fechaUltimoCambioLlantas: "2026-01-10",
  kmUltimoCambioLlantas: 38000,
};

const configEjemplo = {
  diasEntreEngrasadas: 30,
  kmEntreCambioAceite: 3000,
  diasEntreRevisionFrenos: 90,
  kmVidaLlantas: 40000,
};

const historicoUltimos3Viajes = [
  {
    id: "SAV780",
    fechaInicio: "2026-06-15",
    fechaFin: "2026-06-20",
    totalGastos: 745000,
    totalFletes: 920000,
    balance: 175000,
    categoriaMasGasto: "ACPM",
    montoMasGasto: 105000,
  },
  {
    id: "SAV785",
    fechaInicio: "2026-07-01",
    fechaFin: "2026-07-05",
    totalGastos: 680000,
    totalFletes: 890000,
    balance: 210000,
    categoriaMasGasto: "ACPM",
    montoMasGasto: 98000,
  },
];

module.exports = {
  gastosSAV792,
  fletesSAV792,
  gastosAdicionales,
  gastosDelDia,
  vehiculoEjemplo,
  configEjemplo,
  historicoUltimos3Viajes,
};