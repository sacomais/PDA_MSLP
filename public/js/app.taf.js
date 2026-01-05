// Función para cargar el TAF de hoy
async function loadTAF() {
  try {
    const urlNoCache = `data/taf-today.txt?t=${new Date().getTime()}`;
    const response = await fetch(urlNoCache);
    //const response = await fetch('data/taf-today.txt'); // ruta relativa desde 'public/'
    if (!response.ok) throw new Error('No se pudo cargar el TAF');

    const tafText = await response.text();
    document.getElementById('taf-container').textContent = tafText;
  } catch (error) {
    console.error(error);
    document.getElementById('taf-container').textContent = 'TAF no disponible';
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', loadTAF);
