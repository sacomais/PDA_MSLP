(function () {
    const { URL_EXCEL } = window.APP_CONFIG;
    const S = window.APP_STATE;
    const U = window.APP_UTILS;
    const NOMBRE_AEROPUERTO_DISPLAY = "MSLP"; 
  
    async function cargarDatos() {
      const urlNoCache = `${URL_EXCEL}?t=${new Date().getTime()}`;
      try {
          const resp = await fetch(urlNoCache);
          const arrayBuffer = await resp.arrayBuffer();
          const libro = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
          const hoja = libro.Sheets[libro.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true });
          prepararDatos(data);
      } catch (e) {
          console.error(e);
          document.getElementById('total').textContent = "Error cargando datos.";
      }
    }
  
    function prepararDatos(data) {
      const hdrIndex = data.findIndex(row =>
        Array.isArray(row) &&
        row.some(v => v && v.toString().toUpperCase().includes('ETA'))
      );
      
      if (hdrIndex === -1) return;
  
      S.data.header = data[hdrIndex];
      S.data.rows = data.slice(hdrIndex + 1);
  
      const upper = S.data.header.map(h => (h ? h.toString().toUpperCase() : ''));
      S.idx.ETA    = upper.findIndex(s => s.includes('ETA'));
      S.idx.ETD    = upper.findIndex(s => s.includes('ETD'));
      S.idx.AERO   = upper.findIndex(s => s.includes('AEROL') || s.includes('AIRLINE'));
      S.idx.ORIG   = upper.findIndex(s => s.includes('ORIG'));
      S.idx.DEST   = upper.findIndex(s => s.includes('DEST'));
      S.idx.ARRNUM = upper.findIndex(s => s.includes('ARR'));
      S.idx.DEPNUM = upper.findIndex(s => s.includes('DEP'));
  
      window.APP_MAIN.procesarYRender();
    }
  
    function computeAggregates() {
      const llegadas = Array(24).fill(0);
      const salidas = Array(24).fill(0);
      const llegadas15 = Array(96).fill(0);
      const salidas15 = Array(96).fill(0);
      const detalle = [];
  
      S.data.rows.forEach(fila => {
        if (!Array.isArray(fila)) return;
  
        // LLEGADAS
        const minsETA = U.getMinutesFromCell(fila[S.idx.ETA]);
        if (minsETA !== null) {
          const h = Math.floor(minsETA / 60);
          const q = Math.floor(minsETA / 15);
          if (h >= 0 && h < 24) llegadas[h]++;
          if (q >= 0 && q < 96) llegadas15[q]++;
          
          const minsETA_UTC = (minsETA + 360) % 1440;
  
          detalle.push({
            aero: U.safeStr(fila[S.idx.AERO]),
            vuelo: U.safeStr(fila[S.idx.ARRNUM]),
            operacion: 'Llegada',
            hora: U.formatMinutes(minsETA_UTC),
            minutos: minsETA,
            orig: U.safeStr(fila[S.idx.ORIG]),
            dest: NOMBRE_AEROPUERTO_DISPLAY
          });
        }
  
        // SALIDAS
        const minsETD = U.getMinutesFromCell(fila[S.idx.ETD]);
        if (minsETD !== null) {
          const h = Math.floor(minsETD / 60);
          const q = Math.floor(minsETD / 15);
          if (h >= 0 && h < 24) salidas[h]++;
          if (q >= 0 && q < 96) salidas15[q]++;
          
          const minsETD_UTC = (minsETD + 360) % 1440;
  
          detalle.push({
            aero: U.safeStr(fila[S.idx.AERO]),
            vuelo: U.safeStr(fila[S.idx.DEPNUM]),
            operacion: 'Salida',
            hora: U.formatMinutes(minsETD_UTC),
            minutos: minsETD,
            orig: NOMBRE_AEROPUERTO_DISPLAY,
            dest: U.safeStr(fila[S.idx.DEST])
          });
        }
      });
  
      return { llegadas, salidas, llegadas15, salidas15, detalle };
    }
  
    window.APP_DATA = { cargarDatos, prepararDatos, computeAggregates };
})();
