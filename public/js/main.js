(function () {
    const S = window.APP_STATE;
  
    async function init() {
      // 1. Vincular eventos (Botones)
      if (window.APP_UI && window.APP_UI.bindEventos) {
        window.APP_UI.bindEventos();
      }

      // 2. Cargar Datos del Excel
      await window.APP_DATA.cargarDatos();

      // 3. CORRECCIÓN: Cargar TAF y NOTAMs explícitamente
      if (window.APP_TAF && window.APP_TAF.loadTAF) {
          window.APP_TAF.loadTAF();
      }
      if (window.APP_NOTAMS && window.APP_NOTAMS.loadNotams) {
          window.APP_NOTAMS.loadNotams();
      }
    }
  
    function procesarYRender() {
      const { llegadas, salidas, llegadas15, salidas15, detalle } = window.APP_DATA.computeAggregates();
  
      window.APP_UI.updateTotal(llegadas, salidas, llegadas15, salidas15);
      window.APP_UI.renderDetalle(detalle);
      window.APP_UI.updateBlocksSummary(llegadas, salidas);
  
      window.APP_CHARTS.buildHourlyChart(llegadas, salidas);
      window.APP_CHARTS.buildQuarterChart(llegadas15, salidas15);
    }
  
    // Función global PDF
    window.exportarPDF = function() {
      if (!window.html2pdf) { alert("Librería html2pdf no encontrada."); return; }
      const tempDiv = document.createElement('div');
      tempDiv.style.padding = '20px'; tempDiv.style.width = '1100px'; tempDiv.style.background = 'white';
      
      const titulo = document.createElement('h2');
      titulo.innerText = 'Reporte Operacional ATFM - ' + new Date().toLocaleDateString();
      titulo.style.textAlign = 'center'; tempDiv.appendChild(titulo);
  
      const clonar = (id) => {
        const el = document.getElementById(id);
        if (el) {
          const clone = el.cloneNode(true);
          clone.style.margin = '20px 0'; clone.style.pageBreakInside = 'avoid';
          const canvas = el.querySelector('canvas');
          if (canvas) {
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png', 1.0);
            img.style.width = '100%';
            const cClone = clone.querySelector('canvas');
            if(cClone) cClone.parentNode.replaceChild(img, cClone);
            const scroll = clone.querySelector('.chart-scroll-wrapper');
            if(scroll) { scroll.style.overflow='visible'; scroll.style.width='auto'; }
            const bodyS = clone.querySelector('.chart-body-scroll');
            if(bodyS) { bodyS.style.width='100%'; bodyS.style.minWidth='0'; }
          }
          tempDiv.appendChild(clone);
        }
      };
      
      ['card-sem','card-taf','card-notams','card-chart-hourly','card-chart-15'].forEach(clonar);
  
      const opt = {
        margin: 10, filename: `ATFM_Report_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      window.html2pdf().set(opt).from(tempDiv).save();
    };
  
    window.APP_MAIN = { init, procesarYRender };
    init();
})();
