// js/app.ui.js - VERSIÓN SEGURA
(function () {
    const U = window.APP_UTILS;
    const S = window.APP_STATE;
  
    function bindEventos() {
      const btnLimpiar = document.getElementById('btnLimpiar');
      if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
          S.selectedHour = null;
          S.selectedQuarter = null;
          S.filters = { airline: '', hora: '', tipo: '' };
          window.APP_MAIN.procesarYRender();
        });
      }
      
      const btnPDF = document.getElementById('btnPDF');
      // Verificamos si existe la función exportar antes de asignar
      if (btnPDF && window.exportarPDF) {
        btnPDF.addEventListener('click', window.exportarPDF);
      }
    }
  
    function updateTotal(llegadas, salidas, llegadas15, salidas15) {
      const totalOps = llegadas.reduce((a, b) => a + b, 0) + salidas.reduce((a, b) => a + b, 0);
      const totalDiv = document.getElementById('total');
      if (totalDiv) {
        totalDiv.textContent = `Total de operaciones: ${totalOps}`;
      }
    }
  
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
  
    function updateBlocksSummary(llegadas, salidas) {
      const blocks = [
        { id: 'row-manana', start: 6, end: 11 },
        { id: 'row-tarde',  start: 12, end: 17 },
        { id: 'row-noche',  start: 18, end: 28 } 
      ];
  
      blocks.forEach(block => {
        // PROTECCIÓN: Si no encuentra la fila en el HTML, salta al siguiente sin romper nada
        const row = document.getElementById(block.id);
        if (!row) {
            console.warn(`Advertencia: No se encontró la fila con ID '${block.id}' en el HTML.`);
            return; 
        }

        let count = 0;
        for (let i = 0; i < 24; i++) {
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
  
        let text = 'BAJA';
        let className = 'sem-baja';
        if (count >= 20) { text = 'MEDIA'; className = 'sem-media'; }
        if (count >= 40) { text = 'ALTA';  className = 'sem-alta'; }
  
        const cellDemanda = row.querySelector('.demanda-cell');
        if (cellDemanda) {
          cellDemanda.textContent = text;
          cellDemanda.className = 'demanda-cell ' + className;
        }
      });
    }

    // Funciones vacías de compatibilidad
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
