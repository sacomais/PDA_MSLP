// js/app.ui.js
(function () {
    const U = window.APP_UTILS;
    const S = window.APP_STATE;
  
    // Inicializa eventos (Solo botón Restablecer y PDF)
    function bindEventos() {
      // Botón Restablecer
      const btnLimpiar = document.getElementById('btnLimpiar');
      if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
          S.selectedHour = null;
          S.selectedQuarter = null;
          S.filters = { airline: '', hora: '', tipo: '' };
          window.APP_MAIN.procesarYRender();
        });
      }
      
      // Botón PDF (si decidiste poner el listener aquí, aunque en main.js lo expusimos global)
      const btnPDF = document.getElementById('btnPDF');
      if (btnPDF && window.exportarPDF) {
        btnPDF.addEventListener('click', window.exportarPDF);
      }
    }
  
    // Actualiza los contadores totales
    function updateTotal(llegadas, salidas, llegadas15, salidas15) {
      const totalOps = llegadas.reduce((a, b) => a + b, 0) + salidas.reduce((a, b) => a + b, 0);
      const totalDiv = document.getElementById('total');
      if (totalDiv) {
        totalDiv.textContent = `Total de operaciones: ${totalOps}`;
      }
    }
  
    // Renderiza la tabla de detalles
    function renderDetalle(detalle) {
      const tbody = document.querySelector('#tablaDetalle tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
  
      detalle.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d.aero}</td>
          <td>${d.vuelo}</td>
          <td class="${d.operacion === 'Llegada' ? 'op-llegada' : 'op-salida'}">${d.operacion}</td>
          <td>${d.hora}</td>
          <td>${d.orig}</td>
          <td>${d.dest}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  
    // Actualiza el semáforo (Mañana/Tarde/Noche)
    function updateBlocksSummary(llegadas, salidas) {
      // Definición de bloques (índices 0-23)
      const blocks = [
        { id: 'row-manana', start: 6, end: 11 },  // 06:00 - 12:00
        { id: 'row-tarde',  start: 12, end: 17 }, // 12:00 - 18:00
        { id: 'row-noche',  start: 18, end: 28 }  // 18:00 - 05:00 (Manejado con lógica especial)
      ];
  
      blocks.forEach(block => {
        let count = 0;
        // Sumamos operaciones en el rango
        for (let i = 0; i < 24; i++) {
          // Lógica circular para la noche (18 a 5)
          let inRange = false;
          if (block.id === 'row-noche') {
             inRange = (i >= 18) || (i <= 5);
          } else {
             inRange = (i >= block.start && i <= block.end);
          }
          
          if (inRange) {
            count += (llegadas[i] || 0) + (salidas[i] || 0);
          }
        }
  
        // Determinamos color/estado
        let text = 'BAJA';
        let className = 'sem-baja';
        if (count >= 20) { text = 'MEDIA'; className = 'sem-media'; }
        if (count >= 40) { text = 'ALTA';  className = 'sem-alta'; }
  
        // Actualizamos DOM
        const row = document.getElementById(block.id);
        if (row) {
          const cellDemanda = row.querySelector('.demanda-cell');
          if (cellDemanda) {
            cellDemanda.textContent = text;
            cellDemanda.className = 'demanda-cell ' + className;
          }
        }
      });
    }

    // Funciones vacías para que app.data.js no falle si intenta llamarlas
    function poblarFiltroAerolinea() {}
    function poblarFiltroHora() {}
  
    window.APP_UI = { 
      bindEventos, 
      updateTotal, 
      renderDetalle, 
      updateBlocksSummary,
      poblarFiltroAerolinea, 
      poblarFiltroHora 
    };
})();
