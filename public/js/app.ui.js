// ATFM Dashboard v1.2 — app.ui.js
(function () {
  const S = window.APP_STATE;
  const U = window.APP_UTILS;

  function poblarFiltroAerolinea() {
    // Función vaciada por requerimiento de diseño. Ya no usamos este select.
  }

  function poblarFiltroHora() {
    // Función vaciada por requerimiento de diseño. Ya no usamos este select.
  }

  function bindEventos() {
    const btnL = document.getElementById('btnLimpiar');
    const btnExp = document.getElementById('btnExportar');

    if (btnL) {
      btnL.addEventListener('click', () => {
        // Al dar clic en restablecer, solo borramos la selección de las barras
        S.selectedHour = null;
        S.selectedQuarter = null;
        
        // Limpiamos los filtros del estado interno por seguridad
        if (S.filters) {
            S.filters.airline = '';
            S.filters.tipo = '';
        }
        
        // Renderizamos de nuevo los gráficos y quitamos el detalle
        window.APP_MAIN.procesarYRender();
      });
    }

    if (btnExp) {
      btnExp.addEventListener('click', () => {
        exportarDashboardPDF();
      });
    }
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

    const rangos = {
      manana: [6, 7, 8, 9, 10, 11],
      tarde:  [12, 13, 14, 15, 16, 17],
      noche:  [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4] 
    };

    const getEstado = (horasIndices) => {
      let maxOps = 0;
      horasIndices.forEach(h => {
        const totalHora = (llegadas[h] || 0) + (salidas[h] || 0);
        if (totalHora > maxOps) maxOps = totalHora;
      });

      const porcentaje = (maxOps / CAP) * 100;
      
      // AHORA USAMOS LAS CLASES EN LUGAR DE VARIABLES EN LÍNEA
      if (porcentaje >= 80) return { text: 'ALTA',  clase: 'bg-red' };
      if (porcentaje >= 51) return { text: 'MEDIA', clase: 'bg-yellow' };
      return                       { text: 'BAJA',  clase: 'bg-green' };
    };

    ['manana', 'tarde', 'noche'].forEach(periodo => {
      const estado = getEstado(rangos[periodo]);
      const celda = document.getElementById(`demanda-${periodo}`);
      if (celda) {
        celda.textContent = estado.text;
        
        // Limpiamos estilos en línea viejos por si acaso
        celda.style.backgroundColor = '';
        celda.style.color = '';
        
        // Aplicamos la clase correspondiente
        celda.className = `status-cell ${estado.clase}`;
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

  function exportarDashboardPDF() {
    const canvas = document.getElementById('grafico');
    if (!canvas) { alert("El gráfico no está listo"); return; }
    
    const chartImg = canvas.toDataURL("image/png", 1.0);

    const fecha = document.getElementById('fecha-actual').textContent;
    const tituloGrafico = document.getElementById('tituloGraficoHorario').textContent;
    const htmlTaf = document.getElementById('taf-container').innerHTML;
    const htmlNotams = document.getElementById('notams-container').innerHTML;

    const tDemanda = document.querySelector('#contenedor-tabla-demanda .blocks-table');
    const tColores = document.querySelector('#contenedor-tabla-colores .blocks-table');
    const tablaDemandaHtml = tDemanda ? tDemanda.outerHTML : "";
    const tablaColoresHtml = tColores ? tColores.outerHTML : "";

    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
        alert("Por favor, permite las ventanas emergentes para ver el reporte.");
        return;
    }

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>PLAN DIARIO ATFM - ${fecha}</title>
          <style>
            :root { --color-media: #fbc02d; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; width: 100%; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; }
            
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #002F6C; padding-bottom: 10px; margin-bottom: 20px; }
            .header img { height: 55px; }
            .header-text { text-align: center; }
            .header-text h1 { margin: 0; font-size: 14px; color: #002F6C; text-transform: uppercase; }
            .header-text h2 { margin: 5px 0; font-size: 24px; font-weight: 800; color: #222; }
            .date { color: #666; font-size: 14px; font-weight: bold; margin-top: 5px;}

            .section-box { margin-bottom: 20px; border: 1px solid #ccc; padding: 15px; border-radius: 6px; page-break-inside: avoid; }
            .section-title { margin-top: 0; color: #002F6C; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 10px; text-transform: uppercase; font-weight: bold; }
            
            .chart-img { width: 100%; height: auto; display: block; margin: 0 auto; }

            .tables-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: stretch;           
              gap: 20px; 
            }
            .table-wrapper { 
              flex: 0 1 auto; 
              display: flex; 
              flex-direction: column;
            }
            
            /* FUENTE UNIFICADA PARA AMBAS TABLAS: 10px EXACTOS EN ABSOLUTAMENTE TODO */
            table { height: 100%; border-collapse: collapse; font-family: 'Segoe UI', Tahoma, sans-serif; white-space: nowrap; }
            table * { font-size: 10px !important; } /* Esto fuerza 10px a los th, td, strong, span, etc. */
            
            th { background-color: #eee !important; color: #555 !important; padding: 8px 15px; border: 1px solid #ccc; text-align: center; font-weight: bold; }
            td { border: 1px solid #ccc; padding: 8px 15px; text-align: center; }
            .period-cell { background-color: #f9f9f9 !important; text-align: left; padding-left: 10px; color: #333 !important;}
            
            .met-vmc { background-color: #388e3c !important; color: white !important; font-weight: bold; text-align: center; }
            .met-imc { background-color: #fbc02d !important; color: white !important; font-weight: bold; text-align: center; }
            .met-minimos { background-color: #d32f2f !important; color: white !important; font-weight: bold; text-align: center; }
            
            /* CLASES PARA LA DEMANDA (Garantizado que imprime el color) */
            .bg-green { background-color: #388e3c !important; color: white !important; font-weight: bold; text-align: center; }
            .bg-yellow { background-color: #fbc02d !important; color: black !important; font-weight: bold; text-align: center; }
            .bg-red { background-color: #d32f2f !important; color: white !important; font-weight: bold; text-align: center; }

            pre { white-space: pre-wrap; font-family: Consolas, monospace; font-size: 11px; margin: 0; color: #000; }
            .notams-content { font-size: 11px; }

            .no-print { text-align: center; margin-bottom: 20px; padding: 15px; background: #f0f4f8; border: 1px dashed #ccc; border-radius: 8px; }
            .btn-print { background-color: #002F6C; color: white; border: none; padding: 10px 25px; font-size: 14px; cursor: pointer; border-radius: 4px; font-weight: bold; }
            
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; margin: 0; max-width: 100%; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
          </div>

          <div class="header">
            <img src="assets/logo-cepa.png" alt="CEPA" onerror="this.style.display='none'">
            <div class="header-text">
               <h1>Aeropuerto Internacional San Óscar Arnulfo Romero</h1>
               <h2>PLAN DIARIO ATFM</h2>
               <div class="date">${fecha}</div>
            </div>
            <img src="assets/logo-gobierno.png" alt="Gobierno" onerror="this.style.display='none'">
          </div>

          <div class="section-box">
             <h3 class="section-title">${tituloGrafico}</h3>
             <img src="${chartImg}" class="chart-img">
          </div>

          <div class="section-box">
             <h3 class="section-title">DATOS ESTIMADOS PARA EL DIA</h3>
             <div class="tables-row">
                <div class="table-wrapper">
                   ${tablaDemandaHtml}
                </div>
                <div class="table-wrapper">
                   ${tablaColoresHtml}
                </div>
             </div>
          </div>

          <div class="section-box">
             <h3 class="section-title">INFORMACION METEOROLOGICA</h3>
             <pre>${htmlTaf}</pre>
          </div>
             
          <div class="section-box">
             <h3 class="section-title">INFRAESTRUCTURA AEROPORTUARIA - CNS</h3>
             <div class="notams-content">${htmlNotams}</div>
          </div>
        </body>
      </html>
    `);
    
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
  }
  window.APP_UI = { poblarFiltroAerolinea, poblarFiltroHora, bindEventos, updateTotal, renderDetalle, updateBlocksSummary, actualizarPronosticoDesdeTAF, exportarDashboardPDF };
})();
