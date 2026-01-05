// Función para cargar el TAF de hoy
async function loadTAF() {
  try {
    const response = await fetch('data/taf-today.txt'); // ruta relativa desde 'public/'
    if (!response.ok) throw new Error('No se pudo cargar el TAF');

    const tafText = await response.text();
    document.getElementById('taf-container').textContent = tafText;
    // Ejecutar análisis automático de reglas en cuanto hay texto
    if (window.APP_UI && window.APP_UI.actualizarPronosticoDesdeTAF) {
      window.APP_UI.actualizarPronosticoDesdeTAF();
    }
  } catch (error) {
    console.error(error);
    document.getElementById('taf-container').textContent = 'TAF no disponible';
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', loadTAF);
