// ATFM Dashboard - app.notams.js (Versión FAA Oficial)
(function () {
  const U = window.APP_UTILS;

  async function cargarNotams() {
    const container = document.getElementById('notams-container');
    container.innerHTML = '<div style="padding:10px; color:#666;">Consultando base de datos FAA...</div>';

    try {
      // 1. Cargar el JSON (usando timestamp para evitar caché)
      const url = `data/notams.json?t=${new Date().getTime()}`;
      const resp = await fetch(url);
      
      if (!resp.ok) throw new Error('Error al cargar archivo JSON');
      
      const jsonData = await resp.json();
      
      // 2. Extraer la lista de la estructura de la FAA
      // La FAA devuelve: { "notamList": [ ... ], "error": "" }
      const lista = jsonData.notamList || [];

      renderNotams(lista);
    } catch (err) {
      console.error(err);
      container.innerHTML = '<p style="color:red; padding:10px">No hay información de NOTAMs disponible.</p>';
    }
  }

  function renderNotams(lista) {
    const container = document.getElementById('notams-container');
    
    // Filtrar solo los vigentes (la API a veces manda recientes expirados)
    const ahora = new Date();
    const vigentes = lista.filter(n => {
       // La FAA manda fechas en formato ISO o string. Generalmente la propiedad es 'endDate' o 'expirationDate'
       // Si es PERM (permanente), no tiene fecha fin.
       if (!n.endDate) return true; 
       return new Date(n.endDate) > ahora;
    });

    if (!vigentes || vigentes.length === 0) {
      container.innerHTML = '<p style="padding:10px">No hay NOTAMs vigentes en MSLP.</p>';
      return;
    }

    let html = '<ul class="notam-list">';
    
    // Ordenar: Primero los más recientes (basado en startDate)
    vigentes.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    vigentes.forEach(item => {
      // La FAA pone el texto completo en 'icaoMessage'
      let textoRaw = item.icaoMessage || item.text || '';
      
      // Limpieza visual
      textoRaw = textoRaw.replace(/\n/g, ' ').trim();

      const textoSeguro = U.escapeHtml(textoRaw);
      const textoFormateado = resaltarKeywords(textoSeguro);
      
      // Extraemos el ID del NOTAM (ej: A0456/25) para mostrarlo bonito
      const notamId = item.notamNumber || '';

      html += `
        <li class="notam-item">
          <div style="font-weight:bold; color:#002F6C; margin-bottom:2px;">${notamId}</div>
          <div class="notam-text">${textoFormateado}</div>
        </li>`;
    });

    html += '</ul>';
    container.innerHTML = html;
  }

  function resaltarKeywords(texto) {
    return texto
      // Lugares
      .replace(/\b(MSLP|RWY|TWY|APRON|AD)\b/g, '<strong>$1</strong>')
      // Restricciones CRÍTICAS (Rojo)
      .replace(/\b(CLSD|CLOSED|U\/S|UNSERVICEABLE|SUSPENDED|PROHIBITED)\b/g, '<span style="color:var(--color-muy-alta); font-weight:bold;">$1</span>')
      // Precauciones (Naranja)
      .replace(/\b(CTN|CAUTION|WORK|WIP|EST|TRIGGER)\b/g, '<span style="color:var(--color-alta); font-weight:bold;">$1</span>')
      // Fechas/Horas (Azul)
      .replace(/\b(FROM|TO|WEF|PERM|DLY)\b/g, '<span style="color:var(--cepa-light);">$1</span>');
  }

  window.APP_NOTAMS = { cargarNotams };
  document.addEventListener('DOMContentLoaded', cargarNotams);
})();
