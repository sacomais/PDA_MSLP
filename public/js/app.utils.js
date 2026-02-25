// ATFM Dashboard v1.2 — app.utils.js
(function () {
  const U = {};

  U.pad2 = (n) => String(n).padStart(2, '0');

  U.sum = (arr) => arr.reduce((a, b) => a + b, 0);

  U.clampMinutes = (m) => {
    if (!Number.isFinite(m)) return null;
    m = Math.round(m);
    if (m >= 1440) m = m % 1440;
    if (m < 0) m = (m % 1440 + 1440) % 1440;
    return m;
  };

  U.safeStr = (v) => (v === undefined || v === null ? '' : String(v).trim());

  U.escapeHtml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  U.formatMinutes = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${U.pad2(h)}:${U.pad2(m)}`;
  };

  // Reconoce Date, número Excel (fracción de día), HH:mm, HH:mm:ss, HHmm, 12h con AM/PM.
  U.getMinutesFromCell = (value) => {
    if (value === undefined || value === null || value === '') return null;

    if (value instanceof Date)
      return U.clampMinutes(value.getHours() * 60 + value.getMinutes());

    if (typeof value === 'number' && isFinite(value)) {
      let frac = value % 1; if (frac < 0) frac += 1;
      const minutes = Math.round(frac * 24 * 60);
      return U.clampMinutes(minutes);
    }

    if (typeof value === 'string') {
      const s = value.trim();
      const m = s.match(/^(\d{1,2})\s*:\s*(\d{2})(?::\s*(\d{2}))?\s*(AM|PM)?$/i);
      if (m) {
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        const ampm = m[4] ? m[4].toUpperCase() : null;
        if (ampm) {
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
        }
        return U.clampMinutes(h * 60 + min);
      }
      const m2 = s.match(/^(\d{1,2})(\d{2})$/);
      if (m2) {
        const h = parseInt(m2[1], 10);
        const min = parseInt(m2[2], 10);
        return U.clampMinutes(h * 60 + min);
      }
    }
    return null;
  };

  // Colores de barras en función de la selección
  U.getBarColors = (count, base, dim, granularity) => {
    const S = window.APP_STATE;
    if (S.selectedQuarter !== null) {
      if (granularity === 'hour') {
        const hourOfQuarter = Math.floor(S.selectedQuarter / 4);
        return Array.from({ length: count }, (_, h) => h === hourOfQuarter ? base : dim);
      }
      if (granularity === 'quarter') {
        return Array.from({ length: count }, (_, i) => i === S.selectedQuarter ? base : dim);
      }
    }
    if (S.selectedHour !== null) {
      if (granularity === 'hour') {
        return Array.from({ length: count }, (_, h) => h === S.selectedHour ? base : dim);
      }
      if (granularity === 'quarter') {
        return Array.from({ length: count }, (_, i) => Math.floor(i / 4) === S.selectedHour ? base : dim);
      }
    }
    return Array(count).fill(base);
  };

  window.APP_UTILS = U;
})();