// ATFM Dashboard v1.3 — main.js (Con Export PDF y Limpieza)
(function () {
  const S = window.APP_STATE;

  async function init() {
    // Vinculamos eventos (Asegúrate de limpiar app.ui.js como se indica abajo)
    if (window.APP_UI.bindEventos) {
      window.APP_UI.bindEventos();
    }
    await window.APP_DATA.cargarDatos();
  }

  function procesarYRender() {
    // Calculamos datos (sin filtros, ya que se eliminaron en app.data.js)
    const { llegadas, salidas, llegadas15, salidas15, detalle } = window.APP_DATA.computeAggregates();

    // Actualizamos UI
    window.APP_UI.updateTotal(llegadas, salidas, llegadas15, salidas15);
    window.APP_UI.renderDetalle(detalle);
    window.APP_UI.updateBlocksSummary(llegadas, salidas);

    // Renderizamos Gráficos
    window.APP_CHARTS.buildHourlyChart(llegadas, salidas);
    window.APP_CHARTS.buildQuarterChart(llegadas15, salidas15);
  }

  // =========================================================
  // FUNCIÓN NUEVA: EXPORTAR A PDF
  // =========================================================
  window.exportarPDF = function() {
    // 1. Crear un contenedor temporal invisible para armar el reporte
    const tempDiv = document.createElement('div');
    tempDiv.style.padding = '20px';
    tempDiv.style.width = '1100px'; // Ancho fijo para A4 Horizontal

    // 2. Título del PDF
    const titulo = document.createElement('h2');
    titulo.innerText = 'Reporte Operacional ATFM - ' + new Date().toLocaleDateString();
    titulo.style.textAlign = 'center';
    titulo.style.fontFamily = 'Arial, sans-serif';
    tempDiv.appendChild(titulo);

    // 3. Función auxiliar para clonar elementos por ID
    const clonar = (id) => {
      const el = document.getElementById(id);
      if (el) {
        const clone = el.cloneNode(true);
        clone.style.margin = '20px 0';
        clone.style.pageBreakInside = 'avoid'; // Evita cortes de página
        
        // TRUCO PARA GRÁFICOS: Convertir el Canvas a Imagen estática
        const originalCanvas = el.querySelector('canvas');
        if (originalCanvas) {
          const img = document.createElement('img');
          img.src = originalCanvas.toDataURL('image/png', 1.0);
          img.style.width = '100%';
          
          // Reemplazamos el canvas vivo por la imagen en el clon
          const cloneCanvas = clone.querySelector('canvas');
          if (cloneCanvas) {
             cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
          }
          
          // Eliminamos las barras de scroll para que salga el gráfico completo
          const scrollDiv = clone.querySelector('.chart-scroll-wrapper');
          if(scrollDiv) {
              scrollDiv.style.overflow = 'visible';
              scrollDiv.style.width = 'auto';
          }
          const bodyScroll = clone.querySelector('.chart-body-scroll');
          if(bodyScroll) {
              bodyScroll.style.width = '100%'; 
              bodyScroll.style.minWidth = '0'; // Quitar restricción de ancho
          }
        }
        tempDiv.appendChild(clone);
      } else {
        console.warn(`No se encontró el elemento con ID: ${id}`);
      }
    };

    // 4. CLONAR LOS ELEMENTOS (Debes poner estos IDs en tu HTML)
    clonar('card-sem');          // Tabla Demanda/Pronóstico
    clonar('card-taf');          // TAF
    clonar('card-notams');       // NOTAMs
    clonar('card-chart-hourly'); // Gráfico Horario
    clonar('card-chart-15');     // Gráfico 15 min

    // 5. Generar PDF usando la librería
    if (window.html2pdf) {
      const opt = {
        margin:       10,
        filename:     `ATFM_Report_${new Date().toISOString().slice(0,10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      window.html2pdf().set(opt).from(tempDiv).save();
    } else {
      alert("Error: Librería html2pdf no cargada. Verifica el index.html");
    }
  };

  // Exponer a otros módulos
  window.APP_MAIN = { init, procesarYRender };

  // Bootstrap
  init();
})();
