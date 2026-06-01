/* =============================================================================
   engine.js — Motor de presentación: estado, navegación, escalado del stage,
   barra de progreso, contador, deep-linking por hash y render perezoso.
   ============================================================================= */
(function () {
  'use strict';

  var state = { current: 0, total: 0, slides: [], els: [] };
  var dom = {};
  var internalHash = false;

  // ---- Escalado del stage (16:9) para llenar la ventana --------------------
  function scaleStage() {
    var sw = dom.stage.offsetWidth || 1280;
    var sh = dom.stage.offsetHeight || 720;
    var scale = Math.min(window.innerWidth / sw, window.innerHeight / sh);
    dom.stage.style.transform = 'scale(' + scale + ')';
  }

  // ---- Navegación -----------------------------------------------------------
  function clamp(i) { return Math.max(0, Math.min(state.total - 1, i)); }

  function goTo(i, fromHash) {
    i = clamp(i);
    var prevIdx = state.current;
    state.current = i;

    // Completar al instante cualquier animación en curso (avanzar nunca bloquea)
    if (window.PRES.anim) window.PRES.anim.finishAll();

    // Dirección de la transición (para el deslizamiento coordinado)
    dom.stage.classList.toggle('nav-back', i < prevIdx);

    state.els.forEach(function (el, idx) {
      el.classList.toggle('is-active', idx === i);
    });

    // Re-disparar animaciones de entrada al re-visitar (reset en la saliente)
    if (prevIdx !== i && state.els[prevIdx]) {
      // forzar reflow para que el reset de [data-animate] surta efecto la próxima vez
      void state.els[prevIdx].offsetWidth;
    }

    // Progreso + contador
    dom.progress.style.width = ((i + 1) / state.total * 100) + '%';
    dom.counter.innerHTML = '<b>' + (i + 1) + '</b> / ' + state.total;

    // Botones
    dom.prev.disabled = (i === 0);
    dom.next.disabled = (i === state.total - 1);

    // Hash
    if (!fromHash) {
      internalHash = true;
      location.hash = 'slide-' + (i + 1);
    }

    // Render perezoso de gráficos de la slide actual
    if (window.PRES.charts) window.PRES.charts.renderForSlide(state.els[i]);

    // Animaciones de entrada (count-up de cifras destacadas)
    if (window.PRES.anim) window.PRES.anim.enter(state.els[i]);
  }

  function next() { goTo(state.current + 1); }
  function prev() { goTo(state.current - 1); }

  // ---- Eventos --------------------------------------------------------------
  function onKey(e) {
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Spacebar':
        e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End': e.preventDefault(); goTo(state.total - 1); break;
    }
  }

  function onHashChange() {
    if (internalHash) { internalHash = false; return; }
    var m = /slide-(\d+)/.exec(location.hash);
    if (m) goTo(parseInt(m[1], 10) - 1, true);
  }

  // ---- Inicialización -------------------------------------------------------
  function init() {
    dom.stage = document.getElementById('stage');
    dom.progress = document.getElementById('progress');
    dom.counter = document.getElementById('counter');
    dom.prev = document.getElementById('prev');
    dom.next = document.getElementById('next');

    var data = window.PRES_DATA;
    state.slides = data.slides;
    state.total = data.slides.length;

    var frag = document.createDocumentFragment();
    data.slides.forEach(function (s) {
      var el = window.PRES.slides.renderSlide(s);
      state.els.push(el);
      frag.appendChild(el);
    });
    dom.stage.appendChild(frag);

    scaleStage();
    window.addEventListener('resize', scaleStage);
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHashChange);
    dom.prev.addEventListener('click', prev);
    dom.next.addEventListener('click', next);

    // Slide inicial: desde el hash si existe
    var m = /slide-(\d+)/.exec(location.hash);
    goTo(m ? parseInt(m[1], 10) - 1 : 0, true);
  }

  window.PRES = window.PRES || {};
  window.PRES.engine = { init: init, goTo: goTo, next: next, prev: prev, state: state };
})();
