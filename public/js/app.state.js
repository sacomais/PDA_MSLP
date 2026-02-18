// ATFM Dashboard v1.2 — app.state.js
window.APP_STATE = {
  charts: { hourly: null, quarter: null },
  data: { header: [], rows: [] },

  // Índices detectados en el header
  idx: {
    ETA: -1, ETD: -1, AERO: -1, ORIG: -1, DEST: -1, ARRNUM: -1, DEPNUM: -1
  },

  // Selección activa
  selectedHour: null,     // 0..23
  selectedQuarter: null,  // 0..95

  // Filtros UI
  filters: {
    airline: '',
    tipo: '' // '', 'Llegada', 'Salida'
  }
};