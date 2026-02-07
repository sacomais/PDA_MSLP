// ATFM Dashboard v1.2 — app.ui.js
(function () {
  const S = window.APP_STATE;
  const U = window.APP_UTILS;

  //function poblarFiltroAerolinea() {
    //const select = document.getElementById('filtroAerolinea');
    //const aerolineas = new Set();
    //if (S.idx.AERO >= 0) {
      //S.data.rows.forEach(fila => {
        //const val = fila[S.idx.AERO];
        //if (val !== undefined && val !== null && String(val).trim() !== '') {
          //aerolineas.add(String(val).trim());
        //}
      //});
    //}
    //select.innerHTML = `<option value="">Todas</option>` +
      //Array.from(aerolineas).sort().map(a => `<option value="${U.escapeHtml(a)}">${U.escapeHtml(a)}</option>`).join('');
  //}

  //function poblarFiltroHora() {
    //const select = document.getElementById('filtroHora');
    //select.innerHTML = `<option value="">Todas</option>` +
      //Array.from({ length: 24 }, (_, h) => `<option value="${h}">${U.pad2(h)}:00</option>`).join('');
  //}

  function bindEventos() {
    const selA = document.getElementById('filtroAerolinea');
    const selH = document.getElementById('filtroHora');
    const selT = document.getElementById('filtroTipo');
    const btnL = document.getElementById('btnLimpiar');

    selA.addEventListener('change', () => {
      S.filters.airline = selA.value;
      window.APP_MAIN.procesarYRender();
    });

    selT.addEventListener('change', () => {
      S.filters.tipo = selT.value;
      window.APP_MAIN.procesarYRender();
    });

    selH.addEventListener('change', () => {
      const val = selH.value;
      S.selectedHour = val === '' ? null : parseInt(val, 10);
      S.selectedQuarter = null;
      window.APP_MAIN.procesarYRender();
    });

    btnL.addEventListener('click', () => {
      S.selectedHour = null;
      S.selectedQuarter = null;
      S.filters.airline = '';
      S.filters.tipo = '';
      selH.value = '';
      selA.value = '';
      selT.value = '';
      window.APP_MAIN.procesarYRender();
    });
  }

  function updateTotal(llegadas, salidas, llegadas15, salidas15) {
    const totalEl = document.getElementById('total');
    let totalOps = 0;
    if (S.selectedQuarter !== null) {
      totalOps = (llegadas15[S.selectedQuarter] || 0) + (salidas15[S.selectedQuarter] || 0);
    } else if (S.selectedHour !== null) {
      totalOps = (llegadas[S.selectedHour] || 0) + (salidas[S.selectedHour] || 0);
    } else {
      totalOps = U.sum(llegadas) + U.sum(salidas);
    }
    totalEl.textContent = `Total de operaciones: ${totalOps}`;
  }

  function renderDetalle(detalle) {
    const container = document.getElementById('detalleContainer');
    const tbodyDet = document.querySelector('#tablaDetalle tbody');
    tbodyDet.innerHTML = '';

    let filas = [];
    if (S.selectedQuarter !== null) {
      const start = S.selectedQuarter * 15;
      const end = start + 15;
      filas = detalle.filter(op => op.minutos >= start && op.minutos < end);
    } else if (S.selectedHour !== null) {
      filas = detalle.filter(op => Math.floor(op.minutos / 60) === S.selectedHour);
    }

    if ((S.selectedQuarter !== null || S.selectedHour !== null) && filas.length) {
      filas.sort((a, b) => a.minutos - b.minutos || a.operacion.localeCompare(b.operacion) || a.aero.localeCompare(b.aero));
      const rowsHtml = filas.map(op => `
        <tr>
          <td>${U.escapeHtml(op.aero)}</td>
          <td>${U.escapeHtml(op.vuelo)}</td>
          <td>${op.operacion}</td>
          <td>${op.hora}</td>
          <td>${U.escapeHtml(op.orig)}</td>
          <td>${U.escapeHtml(op.dest)}</td>
        </tr>
      `).join('');
      tbodyDet.innerHTML = rowsHtml;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }

  function updateBlocksSummary(llegadas, salidas) {
    const C = window.APP_CONFIG; 
    const CAP = C.CAPACIDAD_DECLARADA_HORA; 

    // Definición de rangos horarios
    const rangos = {
      manana: [6, 7, 8, 9, 10, 11],
      tarde:  [12, 13, 14, 15, 16, 17],
      noche:  [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4] 
    };

    // Función auxiliar para calcular estado
    const getEstado = (horasIndices) => {
      let maxOps = 0;
      horasIndices.forEach(h => {
        const totalHora = (llegadas[h] || 0) + (salidas[h] || 0);
        if (totalHora > maxOps) maxOps = totalHora;
      });

      const porcentaje = (maxOps / CAP) * 100;
      
      // Clasificación según PPT
      if (porcentaje > 100) return { text: 'MUY ALTA', color: 'var(--color-muy-alta)', font: 'white' };
      if (porcentaje >= 80) return { text: 'ALTA',      color: 'var(--color-alta)',     font: 'white' };
      if (porcentaje >= 51) return { text: 'MEDIA',     color: 'var(--color-media)',    font: 'black' };
      return                       { text: 'BAJA',      color: 'var(--color-baja)',     font: 'white' };
    };

    // Aplicar a la UI
    ['manana', 'tarde', 'noche'].forEach(periodo => {
      const estado = getEstado(rangos[periodo]);
      const celda = document.getElementById(`demanda-${periodo}`);
      if (celda) {
        celda.textContent = estado.text;
        celda.style.backgroundColor = estado.color;
        celda.style.color = estado.font;
      }
    });
  }

  // ============================================================
  //  LÓGICA DE PRONÓSTICO AUTOMÁTICO (TAF PARSER)
  // ============================================================

  const ESTADOS_MET = {
    VMC: { text: 'VMC', class: 'met-vmc' },
    IMC: { text: 'IMC', class: 'met-imc' },
    MIN: { text: 'BAJO MINIMOS', class: 'met-minimos' }
  };

  /**
   * Función principal que se llama al cargar el TAF.
   * Analiza el texto y actualiza las celdas, pintando GRIS los bloques pasados.
   */
  function actualizarPronosticoDesdeTAF() {
    const tafElement = document.getElementById('taf-container');
    if (!tafElement) return;

    const rawTaf = tafElement.textContent.trim().toUpperCase();
    if (!rawTaf || rawTaf.includes('CARGANDO') || rawTaf.includes('NO DISPONIBLE')) return;

    // 1. Calcular la severidad del TAF actual (Verde, Naranja, Rojo)
    const resultadoTAF = calcularSeveridad(rawTaf);
    
    // Guardamos estado global para usarlo en el semáforo de demanda
    if (resultadoTAF.text === 'VMC') ESTADO_CLIMA_ACTUAL = 'VMC';
    else if (resultadoTAF.text === 'IMC') ESTADO_CLIMA_ACTUAL = 'IMC';
    else ESTADO_CLIMA_ACTUAL = 'MIN';

    // 2. Obtener hora actual local (0-23)
    const ahora = new Date();
    const horaActual = ahora.getHours();

    // 3. Definir límites de fin de cada bloque
    // Mañana termina a las 12:00
    // Tarde termina a las 18:00
    // Noche termina a las 05:00 del día siguiente (siempre vigente hasta fin del día operativo)
    
    const bloques = [
        { id: 'pronostico-manana', fin: 12 },
        { id: 'pronostico-tarde',  fin: 18 },
        { id: 'pronostico-noche',  fin: 24 } // Asumimos vigencia hasta medianoche/madrugada
    ];

    bloques.forEach(bloque => {
      const celda = document.getElementById(bloque.id);
      if (celda) {
        celda.className = 'status-cell'; // Limpiar clases previas
        celda.removeAttribute('contenteditable');

        // LÓGICA DE TIEMPO:
        // Si la hora actual es mayor o igual a la hora de fin del bloque, el bloque ya pasó.
        if (horaActual >= bloque.fin) {
            // Bloque Finalizado -> GRIS
            celda.classList.add('met-finalizado');
            celda.textContent = '---'; // O "FINALIZADO"
        } else {
            // Bloque Vigente o Futuro -> COLOR DEL TAF
            celda.classList.add(resultadoTAF.class);
            celda.textContent = resultadoTAF.text;
        }
      }
    });

    // Recalcular semáforo de demanda
    if (window.APP_MAIN && window.APP_MAIN.procesarYRender) {
        window.APP_MAIN.procesarYRender();
    }
  }

  /**
   * Motor de reglas meteorológicas (CORREGIDO)
   * Retorna el objeto de estado (MIN, IMC o VMC)
   */
  function calcularSeveridad(tafOriginal) {
    // 1. LIMPIEZA CRÍTICA:
    // Eliminamos los grupos de fecha formato "0606/0706" (4 dígitos / 4 dígitos)
    // para que no se confundan con la visibilidad en metros.
    let taf = tafOriginal.replace(/\d{4}\/\d{4}/g, ' ');
    
    // También limpiamos temperaturas TX/TN (Ej: TX33/0618Z) por seguridad
    taf = taf.replace(/T[XN]\d+\/\d+Z/g, ' ');

    // Expresiones Regulares para extraer valores
    
    // Visibilidad: Busca 4 dígitos (ej: 9999, 0800, 4000)
    const regexVis = /\b(\d{4})\b/g;

    // Techo de Nubes: Busca BKN, OVC o VV seguido de 3 dígitos (ej: OVC010, BKN005)
    const regexCig = /(?:BKN|OVC|VV)(\d{3})/g;

    // Palabras Clave Peligrosas
    const keywordsPeligro = ['TS', 'TSRA', 'SHRA', '+RA', 'FG']; 

    // --- REGLA 1: BAJO MÍNIMOS (ROJO) ---
    // Criterio: Vis < 800m OR Techo < 300ft (003)
    
    // Chequeo de Visibilidad ROJA
    let matchVis;
    while ((matchVis = regexVis.exec(taf)) !== null) {
      const val = parseInt(matchVis[1], 10);
      // Validamos que sea una visibilidad lógica (a veces el viento 24010KT puede confundir si no hay KT)
      // Pero con el replace de arriba ya estamos más seguros.
      if (val < 800) return ESTADOS_MET.MIN;
    }

    // Chequeo de Techo ROJO
    let matchCig;
    while ((matchCig = regexCig.exec(taf)) !== null) {
      const altura = parseInt(matchCig[1], 10);
      if (altura < 3) return ESTADOS_MET.MIN; // 003 = 300ft
    }

    // --- REGLA 2: IMC (NARANJA) ---
    // Criterio: Vis < 5000m OR Techo < 1000ft (010) OR Keywords

    // Resetear regex index
    regexVis.lastIndex = 0; 
    regexCig.lastIndex = 0;

    // Chequeo de Visibilidad NARANJA
    while ((matchVis = regexVis.exec(taf)) !== null) {
      const val = parseInt(matchVis[1], 10);
      if (val < 5000) return ESTADOS_MET.IMC;
    }

    // Chequeo de Techo NARANJA
    while ((matchCig = regexCig.exec(taf)) !== null) {
      const altura = parseInt(matchCig[1], 10);
      if (altura < 10) return ESTADOS_MET.IMC; // 010 = 1000ft
    }

    // Chequeo de Keywords
    const contienePeligro = keywordsPeligro.some(kw => taf.includes(kw));
    if (contienePeligro) return ESTADOS_MET.IMC;

    // --- REGLA 3: VMC (VERDE) ---
    return ESTADOS_MET.VMC;
  }
  window.APP_UI = { poblarFiltroAerolinea, poblarFiltroHora, bindEventos, updateTotal, renderDetalle, updateBlocksSummary, actualizarPronosticoDesdeTAF };
})();
