(function () {
    const U = window.APP_UTILS;
    const S = window.APP_STATE;
  
    function bindEventos() {
      // 1. Botón Restablecer
      const btnLimpiar = document.getElementById('btnLimpiar');
      if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
          S.selectedHour = null;
          S.selectedQuarter = null;
          // Reseteamos filtros internos (aunque no haya inputs visuales)
          S.filters = { airline: '', hora: '', tipo: '' };
          window.APP_MAIN.procesarYRender();
        });
      }
      
      // 2. Botón PDF
      const btnPDF = document.getElementById('btnPDF');
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
      // Definición exacta de IDs que están en el HTML
      const blocks = [
        { id: 'row-manana', start: 6, end: 11 },
        { id: 'row-tarde',  start: 12, end: 17 },
        { id: 'row-noche',  start: 18, end: 28 } // 18 a 05
      ];
  
      blocks.forEach(block => {
        const row = document.getElementById(block.id);
        if (!row) return; // Si no encuentra la fila, no hace nada (evita errores)

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

    // Funciones vacías para evitar errores si Data las llama
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
