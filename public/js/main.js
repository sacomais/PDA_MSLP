(function () {
    const S = window.APP_STATE;
  
    async function init() {
      // 1. Vincular eventos
      if (window.APP_UI.bindEventos) {
        window.APP_UI.bindEventos();
      }
      // 2. Cargar datos
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
    // FUNCIÓN GLOBAL PARA EXPORTAR PDF
    // ==========================================
    window.exportarPDF = function() {
      // Verificar si la librería está cargada
      if (!window.html2pdf) {
          alert("Error: Librería html2pdf no encontrada.");
          return;
      }

      // 1. Crear contenedor temporal
      const tempDiv = document.createElement('div');
      tempDiv.style.padding = '20px';
      tempDiv.style.width = '1100px'; 
      tempDiv.style.background = 'white';
  
      // 2. Título
      const titulo = document.createElement('h2');
      titulo.innerText = 'Reporte Operacional ATFM - ' + new Date().toLocaleDateString();
      titulo.style.textAlign = 'center';
      titulo.style.fontFamily = 'Arial, sans-serif';
      tempDiv.appendChild(titulo);
  
      // 3. Función para clonar y convertir Canvas a Imagen
      const clonar = (id) => {
        const el = document.getElementById(id);
        if (el) {
          const clone = el.cloneNode(true);
          clone.style.margin = '20px 0';
          clone.style.pageBreakInside = 'avoid';
          
          // Buscar Canvas original y reemplazarlo por Imagen en el clon
          const originalCanvas = el.querySelector('canvas');
          if (originalCanvas) {
            const img = document.createElement('img');
            img.src = originalCanvas.toDataURL('image/png', 1.0);
            img.style.width = '100%';
            img.style.height = 'auto';
            
            // Reemplazar canvas por imagen
            const cloneCanvas = clone.querySelector('canvas');
            if (cloneCanvas && cloneCanvas.parentNode) {
                cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
            }
            
            // Ajustar contenedores de scroll para imprimir completo
            const scrollDiv = clone.querySelector('.chart-scroll-wrapper');
            if(scrollDiv) {
                scrollDiv.style.overflow = 'visible';
                scrollDiv.style.width = 'auto';
                scrollDiv.style.height = 'auto';
            }
            const bodyScroll = clone.querySelector('.chart-body-scroll');
            if(bodyScroll) {
                bodyScroll.style.width = '100%'; 
                bodyScroll.style.minWidth = '0';
                bodyScroll.style.overflow = 'visible';
            }
          }
          tempDiv.appendChild(clone);
        }
      };
  
      // 4. Clonar secciones en orden
      clonar('card-sem');          
      clonar('card-taf');          
      clonar('card-notams');       
      clonar('card-chart-hourly'); 
      clonar('card-chart-15');     
  
      // 5. Generar PDF
      const opt = {
        margin: 10,
        filename: `ATFM_Report_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      window.html2pdf().set(opt).from(tempDiv).save();
    };
  
    window.APP_MAIN = { init, procesarYRender };
    
    // Iniciar
    init();
})();
