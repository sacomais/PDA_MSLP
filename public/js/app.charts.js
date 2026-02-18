// ATFM Dashboard v1.3 — app.charts.js (UTC Labels & Dynamic Title)
(function () {
  const C = window.APP_CONFIG;
  const S = window.APP_STATE;
  const U = window.APP_UTILS;

  const tooltipCommon = {
    mode: 'index',
    intersect: false,
    filter: (item) => item.dataset.label !== 'Capacidad declarada',
    callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}` }
  };

  const capacidadLabelPluginHora = {
    id: 'capacidadLabelHora',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: { left }, scales: { y } } = chart;
      if (!y) return;
      const yPos = y.getPixelForValue(C.CAPACIDAD_DECLARADA_HORA);
      ctx.save();
      ctx.fillStyle = 'red';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(C.CAPACIDAD_DECLARADA_HORA), left + 4, yPos);
      ctx.restore();
    }
  };

  const capacidadLabelPlugin15 = {
    id: 'capacidadLabel15',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: { left }, scales: { y } } = chart;
      if (!y) return;
      const yPos = y.getPixelForValue(C.CAPACIDAD_DECLARADA_15);
      ctx.save();
      ctx.fillStyle = 'red';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(C.CAPACIDAD_DECLARADA_15), left + 4, yPos);
      ctx.restore();
    }
  };

  // Función auxiliar para formatear fecha YYMMDD
  function getYYMMDD(dateObj) {
    const y = String(dateObj.getFullYear()).slice(-2);
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  // Actualiza el título del HTML dinámicamente
  function actualizarTituloHorario() {
    const tituloEl = document.getElementById('tituloGraficoHorario');
    if (!tituloEl) return;

    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    // Formato: Información Gráfica de Demanda desde YYMMDD 06:00 UTC./YYMMDD 05:59 UTC.
    const fechaInicio = getYYMMDD(hoy);
    const fechaFin = getYYMMDD(manana);

    tituloEl.textContent = `Información Gráfica de Demanda desde ${fechaInicio} 06:00 UTC./${fechaFin} 05:59 UTC.`;
  }

  function buildHourlyChart(llegadas, salidas) {
    // CAMBIO: Etiquetas en UTC (Local + 6)
    // Local 00 -> UTC 06
    // Local 18 -> UTC 00 (día siguiente)
    const etiquetasUTC = Array.from({ length: 24 }, (_, hLocal) => {
        const hUTC = (hLocal + 6) % 24;
        return U.pad2(hUTC); // Solo el número: "06", "12", "00"
    });

    // Actualizamos el título HTML
    actualizarTituloHorario();

    const ctx = document.getElementById('grafico').getContext('2d');
    if (S.charts.hourly) S.charts.hourly.destroy();

    const bgLleg = U.getBarColors(24, C.COLORS.LLEG_BG, C.COLORS.LLEG_DIM, 'hour');
    const bgSal = U.getBarColors(24, C.COLORS.SAL_BG, C.COLORS.SAL_DIM, 'hour');
    const borderLleg = U.getBarColors(24, C.COLORS.LLEG_BORDER, C.COLORS.LLEG_BORDER, 'hour');
    const borderSal = U.getBarColors(24, C.COLORS.SAL_BORDER, C.COLORS.SAL_BORDER, 'hour');

    S.charts.hourly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: etiquetasUTC, // Usamos las nuevas etiquetas UTC
        datasets: [
          { label: 'Llegadas', data: llegadas, backgroundColor: bgLleg, borderColor: borderLleg, borderWidth: 1.5, stack: 'ops', pointStyle: 'rect' },
          { label: 'Salidas', data: salidas, backgroundColor: bgSal, borderColor: borderSal, borderWidth: 1.5, stack: 'ops', pointStyle: 'rect' },
          {
            label: 'Capacidad declarada',
            data: Array(24).fill(C.CAPACIDAD_DECLARADA_HORA),
            type: 'line',
            borderColor: C.COLORS.CAP_LINE,
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0,
            borderDash: [6, 6],
            pointStyle: 'line'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { display: false, stacked: true, grid: { display: false } }
        },
        plugins: {
          tooltip: tooltipCommon,
          legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 18, boxHeight: 10 } }
        },
        onClick: (evt, elements) => {
          if (elements && elements.length) {
            const idx = elements[0].index;
            S.selectedHour = idx;
            S.selectedQuarter = null;
            document.getElementById('filtroHora').value = String(idx);
            window.APP_MAIN.procesarYRender();
          }
        }
      },
      plugins: [capacidadLabelPluginHora]
    });
  }

  function buildQuarterChart(llegadas15, salidas15) {
    // CAMBIO: Etiquetas en UTC para 15 minutos también
    const etiquetas15UTC = Array.from({ length: 96 }, (_, i) => {
      // i es el índice de 15 min local (0 a 95)
      // Cada hora tiene 4 cuartos. 
      // Hora local = floor(i / 4). Minutos = (i % 4) * 15
      
      const hLocal = Math.floor(i / 4);
      const m = (i % 4) * 15;
      
      const hUTC = (hLocal + 6) % 24; // Conversión a UTC
      
      return `${U.pad2(hUTC)}:${U.pad2(m)}`;
    });

    const ctx15 = document.getElementById('grafico15').getContext('2d');
    if (S.charts.quarter) S.charts.quarter.destroy();

    const bgLleg15 = U.getBarColors(96, C.COLORS.LLEG_BG, C.COLORS.LLEG_DIM, 'quarter');
    const bgSal15 = U.getBarColors(96, C.COLORS.SAL_BG, C.COLORS.SAL_DIM, 'quarter');
    const borderLleg15 = U.getBarColors(96, C.COLORS.LLEG_BORDER, C.COLORS.LLEG_BORDER, 'quarter');
    const borderSal15 = U.getBarColors(96, C.COLORS.SAL_BORDER, C.COLORS.SAL_BORDER, 'quarter');

    S.charts.quarter = new Chart(ctx15, {
      type: 'bar',
      data: {
        labels: etiquetas15UTC, // Etiquetas UTC
        datasets: [
          { label: 'Llegadas', data: llegadas15, backgroundColor: bgLleg15, borderColor: borderLleg15, borderWidth: 1.0, stack: 'ops', pointStyle: 'rect' },
          { label: 'Salidas', data: salidas15, backgroundColor: bgSal15, borderColor: borderSal15, borderWidth: 1.0, stack: 'ops', pointStyle: 'rect' },
          {
            label: 'Capacidad declarada',
            data: Array(96).fill(C.CAPACIDAD_DECLARADA_15),
            type: 'line',
            borderColor: C.COLORS.CAP_LINE,
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0,
            borderDash: [6, 6],
            pointStyle: 'line'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { 
            stacked: true, 
            grid: { display: false },
            ticks: { 
              autoSkip: true,    
              maxTicksLimit: 24, 
              maxRotation: 0,    
              minRotation: 0 
            } 
          },
          y: { display: false, stacked: true, grid: { display: false } }
        },
        plugins: {
          tooltip: tooltipCommon,
          legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 18, boxHeight: 10 } }
        },
        onClick: (evt, elements) => {
          if (elements && elements.length) {
            const idx = elements[0].index;
            S.selectedQuarter = idx;
            S.selectedHour = null;
            document.getElementById('filtroHora').value = '';
            window.APP_MAIN.procesarYRender();
          }
        }
      },
      plugins: [capacidadLabelPlugin15]
    });
  }

  window.APP_CHARTS = { buildHourlyChart, buildQuarterChart };
})();
