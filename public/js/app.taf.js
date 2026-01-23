// Función para cargar el TAF de hoy
async function loadTAF() {
  try {
    const urlNoCache = `data/taf-today.txt?t=${new Date().getTime()}`;
    
    const response = await fetch(urlNoCache); 
    if (!response.ok) throw new Error('No se pudo cargar el TAF');

    let tafText = await response.text();
    
    // CAMBIO: Reemplazar saltos de línea por espacios y quitar espacios dobles
    tafText = tafText.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();
    
    // Mostramos el texto limpio
    const container = document.getElementById('taf-container');
    if (container) {
        container.textContent = tafText;
    }

    // Ejecutar análisis (el analizador sigue funcionando igual aunque sea una línea)
    if (window.APP_UI && window.APP_UI.actualizarPronosticoDesdeTAF) {
      window.APP_UI.actualizarPronosticoDesdeTAF();
    }
  } catch (error) {
    console.error(error);
    const container = document.getElementById('taf-container');
    if (container) {
        container.textContent = 'TAF no disponible';
    }
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', loadTAF);
