// js/main.js
(function () {
    const S = window.APP_STATE;
  
    async function init() {
      if (window.APP_UI.bindEventos) {
        window.APP_UI.bindEventos();
      }
      await window.APP_DATA.cargarDatos();
    }
  
    function procesarYRender() {
      const { llegadas, salidas, llegadas15, salidas15, detalle } = window.APP_DATA.computeAggregates();
  
      window.APP_UI.updateTotal(llegadas, salidas, llegadas15, salidas15);
      window.APP_UI.renderDetalle(detalle);
      window.APP_UI.updateBlocksSummary(llegadas, salidas);
  
      window.APP_CHARTS.buildHourlyChart(llegadas, salidas);
      window.APP_CHARTS.buildQuarterChart(llegadas15, salidas15);
    }
  
    // ==========================================
    // EXPORTAR PDF (Global)
    // ==========================================
    window.exportarPDF = function() {
      // Verifica libreria
      if (!window.html2pdf) {
          alert("Librería html2pdf no cargada. Revisa index.html");
          return;
      }

      const tempDiv = document.createElement('div');
      tempDiv.style.padding = '20px';
      tempDiv.style.width = '1100px'; 
  
      const titulo = document.createElement('h2');
      titulo.innerText = 'Reporte Operacional ATFM - ' + new Date().toLocaleDateString();
      titulo.style.textAlign = 'center';
      titulo.style.fontFamily = 'Arial, sans-serif';
      tempDiv.appendChild(titulo);
  
      const clonar = (id) => {
        const el = document.getElementById(id);
        if (el) {
          const clone = el.cloneNode(true);
          clone.style.margin = '20px 0';
          clone.style.pageBreakInside = 'avoid';
          
          // Clonar Canvas como Imagen
          const originalCanvas = el.querySelector('canvas');
          if (originalCanvas) {
            const img = document.createElement('img');
            img.src = originalCanvas.toDataURL('image/png', 1.0);
            img.style.width = '100%';
            const cloneCanvas = clone.querySelector('canvas');
            if (cloneCanvas) cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
            
            // Ajustar scrolls para que se vea todo
            const scrollDiv = clone.querySelector('.chart-scroll-wrapper');
            if(scrollDiv) {
                scrollDiv.style.overflow = 'visible';
                scrollDiv.style.width = 'auto';
            }
            const bodyScroll = clone.querySelector('.chart-body-scroll');
            if(bodyScroll) {
                bodyScroll.style.width = '100%'; 
                bodyScroll.style.minWidth = '0';
            }
          }
          tempDiv.appendChild(clone);
        }
      };
  
      // CLONAR EN ORDEN (Asegúrate de tener estos IDs en index.html)
      clonar('card-sem');          
      clonar('card-taf');          
      clonar('card-notams');       
      clonar('card-chart-hourly'); 
      clonar('card-chart-15');     
  
      const opt = {
        margin: 10,
        filename: `ATFM_Report_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      window.html2pdf().set(opt).from(tempDiv).save();
    };
  
    window.APP_MAIN = { init, procesarYRender };
    init();
})();
