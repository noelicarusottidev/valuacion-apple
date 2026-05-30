/* =============================================================================
   main.js — Bootstrap. Valida el modelo y arranca la presentación.
   ============================================================================= */
(function () {
  'use strict';
  function boot() {
    try { if (window.PRES.finance) window.PRES.finance.selfTest(); } catch (e) { console.error(e); }
    window.PRES.engine.init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
