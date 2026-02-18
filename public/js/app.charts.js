(function () {
    const C = window.APP_CONFIG;
    const S = window.APP_STATE;
    const U = window.APP_UTILS;
  
    const tooltipCommon = {
      mode: 'index', intersect: false,
      filter: (item) => item.dataset.label !== 'Capacidad declarada',
      callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}` }
    };
  
    // Plugins de etiquetas rojas
    const pluginLabel = (val) => ({
      id: 'capLabel'+val,
      afterDatasetsDraw(chart) {
        const { ctx, chartArea: { left }, scales: { y } } = chart;
        if (!y) return;
        const yPos = y.getPixelForValue(val);
        ctx.save(); ctx.fillStyle = 'red'; ctx.font = 'bold 12px Arial';
        ctx.fillText(String(val), left + 4, yPos); ctx.restore();
      }
    });

    // Fecha Header Gráfico
    function actualizarTitulo() {
      const el = document.getElementById('tituloGraficoHorario');
      if(!el) return;
      const h = new Date(); const m = new Date(h); m.setDate(h.getDate()+1);
      const fmt = d => String(d.getFullYear()).slice(-2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
      el.textContent = `Información Gráfica de Demanda desde ${fmt(h)} 06:00 UTC./${fmt(m)} 05:59 UTC.`;
    }
  
    function buildHourlyChart(llegadas, salidas) {
      actualizarTitulo();
      const ctx = document.getElementById('grafico').getContext('2d');
      if (S.charts.hourly) S.charts.hourly.destroy();
  
      S.charts.hourly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Array.from({length:24},(_,i)=>U.pad2((i+6)%24)),
          datasets: [
            { label: 'Llegadas', data: llegadas, backgroundColor: U.getBarColors(24, C.COLORS.LLEG_BG, C.COLORS.LLEG_DIM, 'hour'), stack: 'ops' },
            { label: 'Salidas', data: salidas, backgroundColor: U.getBarColors(24, C.COLORS.SAL_BG, C.COLORS.SAL_DIM, 'hour'), stack: 'ops' },
            { label: 'Capacidad declarada', data: Array(24).fill(C.CAPACIDAD_DECLARADA_HORA), type: 'line', borderColor: C.COLORS.CAP_LINE, borderDash: [6,6], pointRadius: 0 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: true, grid: { display: false } }, y: { display: false, stacked: true } },
          plugins: { tooltip: tooltipCommon, legend: { position: 'top' } },
          // CORRECCIÓN: Evento Click para filtrar
          onClick: (evt, elements) => {
            if (elements && elements.length > 0) {
              const idx = elements[0].index;
              S.selectedHour = idx; S.selectedQuarter = null;
              window.APP_MAIN.procesarYRender();
            }
          }
        },
        plugins: [pluginLabel(C.CAPACIDAD_DECLARADA_HORA)]
      });
    }
  
    function buildQuarterChart(llegadas15, salidas15) {
      const ctx = document.getElementById('grafico15').getContext('2d');
      if (S.charts.quarter) S.charts.quarter.destroy();
  
      S.charts.quarter = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Array.from({length:96},(_,i)=>`${U.pad2((Math.floor(i/4)+6)%24)}:${U.pad2((i%4)*15)}`),
          datasets: [
            { label: 'Llegadas', data: llegadas15, backgroundColor: U.getBarColors(96, C.COLORS.LLEG_BG, C.COLORS.LLEG_DIM, 'quarter'), stack: 'ops', barPercentage: 1.0, categoryPercentage: 1.0 },
            { label: 'Salidas', data: salidas15, backgroundColor: U.getBarColors(96, C.COLORS.SAL_BG, C.COLORS.SAL_DIM, 'quarter'), stack: 'ops', barPercentage: 1.0, categoryPercentage: 1.0 },
            { label: 'Capacidad declarada', data: Array(96).fill(C.CAPACIDAD_DECLARADA_15), type: 'line', borderColor: C.COLORS.CAP_LINE, borderDash: [6,6], pointRadius: 0 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            x: { 
              stacked: true,
              grid: { 
                display: true, drawOnChartArea: true,
                // CORRECCIÓN GRID: Color gris si es múltiplo de 4 (Inicio de hora)
                color: (ctx) => (ctx.tick.value % 4 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent'),
                lineWidth: 1
              },
              ticks: { autoSkip: true, maxTicksLimit: 24, maxRotation: 0 } 
            },
            y: { display: false, stacked: true }
          },
          plugins: { tooltip: tooltipCommon, legend: { position: 'top' } },
          // CORRECCIÓN: Evento Click para filtrar
          onClick: (evt, elements) => {
            if (elements && elements.length > 0) {
              const idx = elements[0].index;
              S.selectedQuarter = idx; S.selectedHour = null;
              window.APP_MAIN.procesarYRender();
            }
          }
        },
        plugins: [pluginLabel(C.CAPACIDAD_DECLARADA_15)]
      });
    }
  
    window.APP_CHARTS = { buildHourlyChart, buildQuarterChart };
})();
