// Función para cargar el TAF de hoy
async function loadTAF() {
  try {
    // CAMBIO IMPORTANTE: Agregamos ?t=TIMESTAMP para evitar que el navegador use caché viejo
    const urlNoCache = `data/taf-today.txt?t=${new Date().getTime()}`;
    
    const response = await fetch(urlNoCache); 
    if (!response.ok) throw new Error('No se pudo cargar el TAF');

    const tafText = await response.text();
    
    // Mostramos el texto crudo en la tarjeta
    const container = document.getElementById('taf-container');
    if (container) {
        container.textContent = tafText;
    }

    // Ejecutar análisis automático de reglas en cuanto hay texto nuevo
    if (window.APP_UI && window.APP_UI.actualizarPronosticoDesdeTAF) {
      window.APP_UI.actualizarPronosticoDesdeTAF();
    }
  } catch (error) {
    console.error(error);
    const container = document.getElementById('taf-container');
    if (container) {
        container.textContent = 'TAF no disponible (Error de carga)';
    }
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', loadTAF);
