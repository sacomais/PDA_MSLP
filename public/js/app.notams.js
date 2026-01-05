// ATFM Dashboard - app.notams.js
(function () {
  const U = window.APP_UTILS;

  async function cargarNotams() {
    const container = document.getElementById('notams-container');
    container.innerHTML = 'Cargando NOTAMs...';

    try {
      // Usamos el timestamp para evitar caché (igual que con el TAF)
      const url = `data/notams.json?t=${new Date().getTime()}`;
      const resp = await fetch(url);
      
      if (!resp.ok) throw new Error('Error al cargar archivo JSON');
      
      const data = await resp.json();
      
      // La API devuelve un objeto: { "MSLP": [ ...array de notams... ] }
      const listaNotams = data['MSLP'];

      renderNotams(listaNotams);
    } catch (err) {
      console.error(err);
      container.innerHTML = '<p style="color:red">No hay información de NOTAMs disponible.</p>';
    }
  }

  function renderNotams(lista) {
    const container = document.getElementById('notams-container');
    
    if (!lista || lista.length === 0) {
      container.innerHTML = '<p>No hay NOTAMs vigentes.</p>';
      return;
    }

    // Creamos una lista HTML
    let html = '<ul class="notam-list">';
    
    lista.forEach(item => {
      // Limpiamos el texto raw para que sea seguro
      const rawText = U.escapeHtml(item.raw || item.notamRaw || '');
      
      // Opcional: Resaltar palabras clave como RWY, TWY, CLSD
      const textoFormateado = resaltarKeywords(rawText);

      html += `
        <li class="notam-item">
          <div class="notam-text">${textoFormateado}</div>
        </li>`;
    });

    html += '</ul>';
    container.innerHTML = html;
  }

  // Pequeña utilidad para destacar palabras críticas
  function resaltarKeywords(texto) {
    // Reemplaza palabras clave con un span negrita/color
    return texto
      .replace(/(RWY|TWY|APRON|AD)/g, '<strong>$1</strong>')
      .replace(/(CLSD|U\/S|UNSERVICEABLE|WORK)/g, '<span style="color:red; font-weight:bold;">$1</span>')
      .replace(/(CTN|CAUTION)/g, '<span style="color:orange; font-weight:bold;">$1</span>');
  }

  // Exponer función o auto-iniciar
  window.APP_NOTAMS = { cargarNotams };

  // Iniciar al cargar (o puedes llamarlo desde main.js)
  document.addEventListener('DOMContentLoaded', cargarNotams);
})();
