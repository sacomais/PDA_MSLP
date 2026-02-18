(function () {
    const C = window.APP_CONFIG;
    const S = window.APP_STATE;
    const U = window.APP_UTILS;
  
    // Tooltips
    const tooltipCommon = {
      mode: 'index',
      intersect: false,
      filter: (item) => item.dataset.label !== 'Capacidad declarada',
      callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}` }
    };
  
    // Etiquetas de Capacidad (Plugins)
    const capacidadLabelPluginHora = {
      id: 'capacidadLabelHora',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea: { left }, scales: { y } } = chart;
        if (!y) return;
        const yPos = y.getPixelForValue(C.CAPACIDAD_DECLARADA_HORA);
        ctx.save();
        ctx.fillStyle = 'red';
        ctx.font = 'bold 12px Arial';
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
        ctx.fillText(String(C.CAPACIDAD_DECLARADA_15), left + 4, yPos);
        ctx.restore();
      }
    };
  
    // Fecha YYMMDD
    function getYYMMDD(dateObj) {
      const y = String(dateObj.getFullYear()).slice(-2);
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    }
  
    function actualizarTituloHorario() {
      const tituloEl = document.getElementById('tituloGraficoHorario');
      if (!tituloEl) return;
      const hoy = new Date();
      const manana = new Date(hoy);
      manana.setDate(hoy.getDate() + 1);
      const f1 = getYYMMDD(hoy);
      const f2 = getYYMMDD(manana);
      tituloEl.textContent = `Información Gráfica de Demanda desde ${f1} 06:00 UTC./${f2} 05:59 UTC.`;
    }
  
    // ----------------------
    // GRÁFICO HORARIO
    // ----------------------
    function buildHourlyChart(llegadas, salidas) {
      // Eje X: 00..23 local -> UTC+6
      const etiquetasUTC = Array.from({ length: 24 }, (_, hLocal) => {
          return U.pad2((hLocal + 6) % 24);
      });
  
      actualizarTituloHorario();
  
      const ctx = document.getElementById('grafico').getContext('2d');
      if (S.charts.hourly) S.charts.hourly.destroy();
  
      const bgLleg = U.getBarColors(24, C.COLORS.LLEG_BG, C.COLORS.LLEG_DIM, 'hour');
      const bgSal = U.getBarColors(24, C.COLORS.SAL_BG, C.COLORS.SAL_DIM, 'hour');
  
      S.charts.hourly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: etiquetasUTC,
          datasets: [
            { label: 'Llegadas', data: llegadas, backgroundColor: bgLleg, stack: 'ops' },
            { label: 'Salidas', data: salidas, backgroundColor: bgSal, stack: 'ops' },
            {
              label: 'Capacidad declarada',
              data: Array(24).fill(C.CAPACIDAD_DECLARADA_HORA),
              type: 'line',
              borderColor: C.COLORS.CAP_LINE,
              borderWidth: 2,
              pointRadius: 0,
              borderDash: [6, 6]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { display: false, stacked: true }
          },
          plugins: { tooltip: tooltipCommon, legend: { position: 'top' } }
        },
        plugins: [capacidadLabelPluginHora]
      });
    }
  
    // ----------------------
    // GRÁFICO 15 MIN
    // ----------------------
    function buildQuarterChart(llegadas15, salidas15) {
      const etiquetas15UTC = Array.from({ length: 96 }, (_, i) => {
        const hLocal = Math.floor(i / 4);
        const m = (i % 4) * 15;
        const hUTC = (hLocal + 6) % 24;
        return `${U.pad2(hUTC)}:${U.pad2(m)}`;
      });
  
      const ctx15 = document.getElementById('grafico15').getContext('2d');
      if (S.charts.quarter) S.charts.quarter.destroy();
  
      const bgLleg15 = U.getBarColors(96, C.COLORS.LLEG_BG, C.COLORS.LLEG_DIM, 'quarter');
      const bgSal15 = U.getBarColors(96, C.COLORS.SAL_BG, C.COLORS.SAL_DIM, 'quarter');
  
      S.charts.quarter = new Chart(ctx15, {
        type: 'bar',
        data: {
          labels: etiquetas15UTC,
          datasets: [
            { label: 'Llegadas', data: llegadas15, backgroundColor: bgLleg15, stack: 'ops', barPercentage: 1.0, categoryPercentage: 1.0 },
            { label: 'Salidas', data: salidas15, backgroundColor: bgSal15, stack: 'ops', barPercentage: 1.0, categoryPercentage: 1.0 },
            {
              label: 'Capacidad declarada',
              data: Array(96).fill(C.CAPACIDAD_DECLARADA_15),
              type: 'line',
              borderColor: C.COLORS.CAP_LINE,
              borderWidth: 2,
              pointRadius: 0,
              borderDash: [6, 6]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { 
              stacked: true, 
              // === AQUÍ ESTÁ EL TRUCO DE LAS LÍNEAS DIVISORIAS ===
              grid: { 
                display: true,
                drawOnChartArea: true,
                // Pinta una línea gris suave cada 4 barras (cada hora)
                color: (context) => {
                    if (context.tick && context.tick.value % 4 === 0) {
                        return 'rgba(0, 0, 0, 0.15)'; // Gris visible
                    }
                    return 'transparent'; // Oculto resto del tiempo
                },
                lineWidth: 1
              },
              ticks: { autoSkip: true, maxTicksLimit: 24, maxRotation: 0 } 
            },
            y: { display: false, stacked: true }
          },
          plugins: { tooltip: tooltipCommon, legend: { position: 'top' } }
        },
        plugins: [capacidadLabelPlugin15]
      });
    }
  
    window.APP_CHARTS = { buildHourlyChart, buildQuarterChart };
})();
