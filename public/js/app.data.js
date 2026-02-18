(function () {
    const { URL_EXCEL } = window.APP_CONFIG;
    const S = window.APP_STATE;
    const U = window.APP_UTILS;
  
    async function cargarDatos() {
      try {
        const resp = await fetch(`${URL_EXCEL}?t=${Date.now()}`);
        const ab = await resp.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array', cellDates: true });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true });
        prepararDatos(data);
      } catch (e) {
        document.getElementById('total').textContent = "Error cargando datos.";
      }
    }
  
    function prepararDatos(data) {
      const idx = data.findIndex(r => Array.isArray(r) && r.some(v => v && String(v).match(/ETA/i)));
      if (idx === -1) return;
  
      S.data.rows = data.slice(idx + 1);
      S.data.header = data[idx].map(x => x ? String(x).toUpperCase() : '');
      const h = S.data.header;
      
      S.idx.ETA = h.findIndex(x => x.includes('ETA'));
      S.idx.ETD = h.findIndex(x => x.includes('ETD'));
      S.idx.AERO = h.findIndex(x => x.includes('AEROL') || x.includes('AIRLINE'));
      S.idx.ARRNUM = h.findIndex(x => x.includes('ARR'));
      S.idx.DEPNUM = h.findIndex(x => x.includes('DEP'));
      S.idx.ORIG = h.findIndex(x => x.includes('ORIG'));
      S.idx.DEST = h.findIndex(x => x.includes('DEST'));
  
      window.APP_MAIN.procesarYRender();
    }
  
    function computeAggregates() {
      const llegadas = Array(24).fill(0), salidas = Array(24).fill(0);
      const llegadas15 = Array(96).fill(0), salidas15 = Array(96).fill(0);
      const detalle = [];
  
      S.data.rows.forEach(row => {
        if (!Array.isArray(row)) return;
  
        // CORRECCIÓN: Recuperar lógica de filtro por selección (Click en gráfico)
        // Si hay hora seleccionada, verificamos si coincide. Si no, mostramos todo.
        let matchHour = true; 
        let matchQuarter = true;
  
        const mArr = U.getMinutesFromCell(row[S.idx.ETA]);
        const mDep = U.getMinutesFromCell(row[S.idx.ETD]);
  
        // Procesar Llegada
        if (mArr !== null) {
            const h = Math.floor(mArr/60);
            const q = Math.floor(mArr/15);
            // Sumar a totales (independiente de la selección para que el gráfico no desaparezca)
            if(h<24) llegadas[h]++;
            if(q<96) llegadas15[q]++;
            
            // Verificar Filtro Selección
            if (S.selectedHour !== null && h !== S.selectedHour) matchHour = false;
            if (S.selectedQuarter !== null && q !== S.selectedQuarter) matchQuarter = false;

            if (matchHour && matchQuarter) {
                detalle.push({
                    aero: U.safeStr(row[S.idx.AERO]), vuelo: U.safeStr(row[S.idx.ARRNUM]),
                    operacion: 'Llegada', hora: U.formatMinutes((mArr+360)%1440),
                    orig: U.safeStr(row[S.idx.ORIG]), dest: 'MSLP'
                });
            }
        }
        
        // Reset match flags para Salida
        matchHour = true; matchQuarter = true;

        // Procesar Salida
        if (mDep !== null) {
            const h = Math.floor(mDep/60);
            const q = Math.floor(mDep/15);
            if(h<24) salidas[h]++;
            if(q<96) salidas15[q]++;

            if (S.selectedHour !== null && h !== S.selectedHour) matchHour = false;
            if (S.selectedQuarter !== null && q !== S.selectedQuarter) matchQuarter = false;

            if (matchHour && matchQuarter) {
                detalle.push({
                    aero: U.safeStr(row[S.idx.AERO]), vuelo: U.safeStr(row[S.idx.DEPNUM]),
                    operacion: 'Salida', hora: U.formatMinutes((mDep+360)%1440),
                    orig: 'MSLP', dest: U.safeStr(row[S.idx.DEST])
                });
            }
        }
      });
  
      return { llegadas, salidas, llegadas15, salidas15, detalle };
    }
  
    window.APP_DATA = { cargarDatos, prepararDatos, computeAggregates };
})();
