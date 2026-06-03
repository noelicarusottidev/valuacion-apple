/* =============================================================================
   anim.js — Sistema de animaciones transversal (capa estética sobre el contenido).
   - count-up: las cifras destacadas suben de 0 a su valor al entrar la slide.
   - Se engancha al cambio de slide del engine (enter/finishAll).
   SEGUROS: el valor final ya está en el DOM (degradación elegante); finishAll()
   completa al instante al avanzar; respeta prefers-reduced-motion.
   NO toca la lógica financiera: solo reusa fmt() para mostrar los mismos números.
   ============================================================================= */
(function () {
  'use strict';

  var fin = function () { return window.PRES && window.PRES.finance; };

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  // Selectores de cifras destacadas a las que aplicar count-up.
  var SELECTOR = '.hero-value, .stat-value, .data-table td.num, .scn-price, .scn-ret-num, .pe-hero-num, .conc-num, .emp-num';

  // Parsea un texto es-AR y extrae su ÚNICO número. Devuelve null si hay 0 o ≥2
  // números (rangos, "—", miles con espacio, etc.) → en esos casos no se anima.
  var NUM_RE = /[−+\-]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[−+\-]?\d+(?:,\d+)?/g;
  function parseNum(text) {
    var matches = text.match(NUM_RE);
    if (!matches || matches.length !== 1) return null;
    var token = matches[0];
    var idx = text.indexOf(token);
    var prefix = text.slice(0, idx);
    var suffix = text.slice(idx + token.length);
    var plus = token.charAt(0) === '+';
    // Normaliza a número JS: quita signo, saca puntos de miles, coma → punto decimal.
    var body = token.replace(/^[−+\-]/, '');
    var dec = 0;
    var ci = body.indexOf(',');
    if (ci >= 0) dec = body.length - ci - 1;
    var num = parseFloat(body.replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return null;
    if (/^[−\-]/.test(token)) num = -num;
    return { prefix: prefix, value: num, dec: dec, plus: plus, suffix: suffix };
  }

  var running = []; // { el, raf } de count-ups en curso

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function countUp(el, delay) {
    var f = fin(); if (!f) return;
    // Guarda el valor final una sola vez (para degradación / restauración).
    if (el.dataset.cuTarget == null) el.dataset.cuTarget = el.textContent;
    var finalText = el.dataset.cuTarget;
    var p = parseNum(finalText);
    if (!p) return; // no es un número simple → se deja el texto final tal cual

    var DUR = 650;
    var render = function (v) {
      el.textContent = p.prefix + (p.plus ? '+' : '') + f.fmt(v, p.dec) + p.suffix;
    };
    var start = null, entry = { el: el, raf: 0 };
    running.push(entry);
    var begun = false;

    function frame(now) {
      if (start === null) start = now;
      var elapsed = now - start;
      if (elapsed < delay) { // pequeño retardo alineado al stagger del bloque
        if (!begun) { render(0); begun = true; }
        entry.raf = requestAnimationFrame(frame);
        return;
      }
      begun = true;
      var t = Math.min(1, (elapsed - delay) / DUR);
      render(p.value * easeOutCubic(t));
      if (t < 1) { entry.raf = requestAnimationFrame(frame); }
      else { render(p.value); done(entry); }
    }
    entry.raf = requestAnimationFrame(frame);
  }

  function done(entry) {
    var i = running.indexOf(entry);
    if (i >= 0) running.splice(i, 1);
  }

  // Completa al instante todo lo que esté corriendo (avanzar nunca bloquea).
  function finishAll() {
    while (running.length) {
      var e = running.pop();
      if (e.raf) cancelAnimationFrame(e.raf);
      if (e.el.dataset.cuTarget != null) e.el.textContent = e.el.dataset.cuTarget;
    }
  }

  // Dispara las animaciones de entrada de la slide (count-up de sus cifras).
  function enter(slideEl) {
    if (!slideEl) return;
    var nodes = slideEl.querySelectorAll(SELECTOR);
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.childElementCount !== 0) return;            // solo nodos hoja de texto
      if (el.closest('[data-sim]')) return;              // nunca tocar las piezas interactivas
      if (el.dataset.cuTarget == null) el.dataset.cuTarget = el.textContent;
      if (reduced()) { el.textContent = el.dataset.cuTarget; return; } // sin animación
      // retardo alineado al stagger del bloque contenedor (--i)
      var host = el.closest('[data-animate]');
      var i = host ? parseFloat(host.style.getPropertyValue('--i')) : 0;
      if (isNaN(i)) i = 0;
      var delay = 120 + i * 90;
      countUp(el, delay);
    });
  }

  window.PRES = window.PRES || {};
  window.PRES.anim = { enter: enter, finishAll: finishAll, reduced: reduced };
})();
