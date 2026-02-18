// ATFM Dashboard v1.2 — main.js
(function () {
  const S = window.APP_STATE;

  async function init() {
    window.APP_UI.bindEventos();
    await window.APP_DATA.cargarDatos();
  }

  function procesarYRender() {
    const { llegadas, salidas, llegadas15, salidas15, detalle } = window.APP_DATA.computeAggregates();

    window.APP_UI.updateTotal(llegadas, salidas, llegadas15, salidas15);
    window.APP_UI.renderDetalle(detalle);

    // NUEVO: Actualizar la tabla de bloques Mañana/Tarde/Noche
    window.APP_UI.updateBlocksSummary(llegadas, salidas);

    window.APP_CHARTS.buildHourlyChart(llegadas, salidas);
    window.APP_CHARTS.buildQuarterChart(llegadas15, salidas15);
  }

  // Exponer a otros módulos
  window.APP_MAIN = { init, procesarYRender };

  // Bootstrap
  init();
})();
