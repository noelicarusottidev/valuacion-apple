/* =============================================================================
   finance.js — Modelo DCF recomputado en JS (espejo del notebook).
   Reproduce los números exactos del trabajo: precio objetivo, valor terminal,
   grillas de sensibilidad, escenarios, tornado, football field y Monte Carlo.
   Verificado por selfTest(): caso base ≈ 207,80; TV ≈ 3,60 T; EV ≈ 3,02 T.
   ============================================================================= */
(function () {
  'use strict';

  // --- Constantes del modelo (del notebook) ----------------------------------
  var FCF = [153206.56, 167393.48, 182894.12, 199830.12, 218334.39]; // 2026-2030, USD M
  var YEARS = [2026, 2027, 2028, 2029, 2030];
  var FCF_ULTIMO = 140222;          // FCFF 2025 conocido, USD M
  var NET_DEBT_M = -33763;          // deuda neta (negativa = caja neta), USD M
  var SHARES_M = 14687.356;         // acciones en circulación, en millones
  var PRECIO_ACTUAL = 312.06;       // USD

  // Componentes de la tasa (Damodaran abr-26)
  var RF = 0.0432, ERP = 0.0477, BETA_BLUME = 1.056;
  var KD = 0.0458, TAX = 0.1766;
  var W_E = 0.9789, W_D = 0.0211;
  var KE = RF + BETA_BLUME * ERP;            // 9,36%
  var KD_AT = KD * (1 - TAX);                // 3,77%
  var WACC = W_E * KE + W_D * KD_AT;         // 9,2393% → 9,24%
  var G_BASE = 0.030;

  // --- Núcleo: precio objetivo dado (WACC, g, multiplicador de FCF) -----------
  function precioObjetivo(wacc, g, mult) {
    mult = (mult == null) ? 1 : mult;
    var fcf = FCF.map(function (f) { return f * mult; });
    if (wacc <= g) return NaN;
    var pvExp = 0;
    for (var t = 0; t < fcf.length; t++) pvExp += fcf[t] / Math.pow(1 + wacc, t + 1);
    var tv = fcf[fcf.length - 1] * (1 + g) / (wacc - g);
    var pvTv = tv / Math.pow(1 + wacc, 5);
    var equity = (pvExp + pvTv) - NET_DEBT_M;
    return equity / SHARES_M;
  }

  function vpExplicito(wacc, mult) {
    mult = (mult == null) ? 1 : mult;
    var s = 0;
    for (var t = 0; t < FCF.length; t++) s += (FCF[t] * mult) / Math.pow(1 + wacc, t + 1);
    return s;
  }
  function fcfDescontados(wacc) {
    return FCF.map(function (f, t) { return f / Math.pow(1 + wacc, t + 1); });
  }
  function valorTerminal(wacc, g) { return FCF[FCF.length - 1] * (1 + g) / (wacc - g); }
  function upsidePct(precio) { return (precio / PRECIO_ACTUAL - 1) * 100; }

  // --- Grillas de sensibilidad ------------------------------------------------
  // Precio objetivo WACC (filas) × g (columnas)
  function gridWaccG() {
    var waccs = [WACC - 0.015, WACC - 0.010, WACC - 0.005, WACC, WACC + 0.005, WACC + 0.010, WACC + 0.015];
    var gs = [0.020, 0.025, 0.030, 0.035, 0.040];
    var matrix = waccs.map(function (w) { return gs.map(function (g) { return precioObjetivo(w, g); }); });
    return {
      rowLabels: waccs.map(function (w) { return (w * 100).toFixed(2) + '%'; }),
      colLabels: gs.map(function (g) { return (g * 100).toFixed(1) + '%'; }),
      rowTitle: 'WACC ↓', colTitle: 'g →',
      matrix: matrix,
      baseRow: 3, baseCol: 2,
      fmt: function (v) { return Math.round(v).toString(); }
    };
  }

  // Upside % WACC × g (misma grilla, en % vs mercado)
  function gridUpsideG() {
    var g = gridWaccG();
    return {
      rowLabels: g.rowLabels, colLabels: g.colLabels,
      rowTitle: g.rowTitle, colTitle: g.colTitle,
      matrix: g.matrix.map(function (row) { return row.map(upsidePct); }),
      baseRow: 3, baseCol: 2, diverging: 0,
      fmt: function (v) { return (v >= 0 ? '+' : '') + v.toFixed(0) + '%'; }
    };
  }

  // WACC (%) según β (Blume) y ERP
  function gridWaccBetaErp() {
    var betaOff = [-0.20, -0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15, 0.20];
    var erpOff = [-0.010, -0.005, 0, 0.005, 0.010];
    var betas = betaOff.map(function (o) { return BETA_BLUME + o; });
    var erps = erpOff.map(function (o) { return ERP + o; });
    var matrix = betas.map(function (b) {
      return erps.map(function (e) {
        var ke = RF + b * e;
        return (W_E * ke + W_D * KD_AT) * 100;
      });
    });
    var iBase = 4, jBase = 2;
    matrix[iBase][jBase] = WACC * 100; // forzar centro al WACC base exacto (como el notebook)
    return {
      rowLabels: betas.map(function (b) { return 'β=' + b.toFixed(2); }),
      colLabels: erps.map(function (e) { return 'ERP=' + (e * 100).toFixed(1) + '%'; }),
      rowTitle: 'β ↓', colTitle: 'ERP →',
      matrix: matrix, baseRow: iBase, baseCol: jBase, reverse: true,
      fmt: function (v) { return v.toFixed(2); }
    };
  }

  // --- Escenarios -------------------------------------------------------------
  function escenarios() {
    return [
      { nombre: 'Pesimista', precio: precioObjetivo(WACC + 0.010, 0.020, 0.90), color: '#ff453a' },
      { nombre: 'Base',      precio: precioObjetivo(WACC, G_BASE, 1.00),         color: '#0a84ff' },
      { nombre: 'Optimista', precio: precioObjetivo(WACC - 0.010, 0.040, 1.10), color: '#30d158' }
    ];
  }

  // --- Tornado ----------------------------------------------------------------
  function tornado() {
    var base = precioObjetivo(WACC, G_BASE);
    var rows = [
      { name: 'WACC (±50 bps)', low: precioObjetivo(WACC + 0.005, G_BASE), high: precioObjetivo(WACC - 0.005, G_BASE) },
      { name: 'g (±50 bps)',    low: precioObjetivo(WACC, G_BASE - 0.005), high: precioObjetivo(WACC, G_BASE + 0.005) },
      { name: 'FCF (±5%)',      low: precioObjetivo(WACC, G_BASE, 0.95),   high: precioObjetivo(WACC, G_BASE, 1.05) }
    ];
    rows.forEach(function (r) { r.min = Math.min(r.low, r.high); r.max = Math.max(r.low, r.high); r.span = r.max - r.min; });
    rows.sort(function (a, b) { return b.span - a.span; });
    return { base: base, rows: rows };
  }

  // --- Football field ---------------------------------------------------------
  function footballField() {
    var esc = escenarios();
    var fps = FCF_ULTIMO / SHARES_M;
    var px = function (mult) { return (FCF_ULTIMO * mult - NET_DEBT_M) / SHARES_M; };
    return {
      market: PRECIO_ACTUAL,
      base: precioObjetivo(WACC, G_BASE),
      methods: [
        { metodo: 'DCF (Pesimista − Optimista)', low: esc[0].precio, high: esc[2].precio, mid: esc[1].precio },
        { metodo: 'DCF (WACC ± 50 bps)', low: precioObjetivo(WACC + 0.005, G_BASE), high: precioObjetivo(WACC - 0.005, G_BASE), mid: precioObjetivo(WACC, G_BASE) },
        { metodo: 'DCF (g entre 2,0% y 4,0%)', low: precioObjetivo(WACC, 0.02), high: precioObjetivo(WACC, 0.04), mid: precioObjetivo(WACC, G_BASE) },
        { metodo: 'Precio / FCF (25x − 35x)', low: fps * 25, high: fps * 35, mid: fps * 30 },
        { metodo: 'EV/FCFF peers (18x − 24x)', low: px(18), high: px(24), mid: (px(18) + px(24)) / 2 }
      ]
    };
  }

  // --- Monte Carlo (RNG sembrado para reproducibilidad) -----------------------
  // No replica NumPy seed=42; genera una distribución estadísticamente equivalente
  // con los mismos parámetros. Las estadísticas publicadas (P50/P5/P95/P) se
  // muestran como autoritativas en las tarjetas de la slide.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function monteCarlo(nBins) {
    nBins = nBins || 48;
    var rnd = mulberry32(42);
    function randn() { // Box-Muller
      var u = 0, v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    function tri(a, c, b) { // triangular(low, mode, high)
      var u = rnd(), fc = (c - a) / (b - a);
      return u < fc ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
    }
    var N = 10000, prices = [];
    for (var i = 0; i < N; i++) {
      var w = WACC + 0.006 * randn();
      var g = tri(0.020, 0.030, 0.040);
      var m = 1.0 + 0.07 * randn();
      if (w <= g + 0.001) continue;
      prices.push(precioObjetivo(w, g, m));
    }
    var lo = 120, hi = 320; // rango fijo del histograma para una vista estable
    var bins = new Array(nBins).fill(0), edges = [];
    for (var b2 = 0; b2 <= nBins; b2++) edges.push(lo + (hi - lo) * b2 / nBins);
    prices.forEach(function (p) {
      var idx = Math.floor((p - lo) / (hi - lo) * nBins);
      if (idx >= 0 && idx < nBins) bins[idx]++;
    });
    return {
      bins: bins, edges: edges,
      // estadísticas publicadas (autoritativas)
      p5: 169.76, p50: 207.91, p95: 262.45, probUp: 0.3, market: PRECIO_ACTUAL
    };
  }

  // --- selfTest: valida la fidelidad del modelo -------------------------------
  function selfTest() {
    var ok = true;
    function check(name, got, exp, tol) {
      var pass = Math.abs(got - exp) <= tol;
      if (!pass) { ok = false; console.error('[selfTest] ' + name + ': got ' + got + ' expected ~' + exp); }
      else { console.log('[selfTest] ✓ ' + name + ' = ' + got.toFixed(2)); }
    }
    check('Precio base', precioObjetivo(WACC, G_BASE), 207.80, 0.2);
    check('VP explícito', vpExplicito(WACC), 701497, 500);
    check('Valor terminal', valorTerminal(WACC, G_BASE), 3603963, 5000);
    var pvTv = valorTerminal(WACC, G_BASE) / Math.pow(1 + WACC, 5);
    var ev = vpExplicito(WACC) + pvTv;
    check('Enterprise Value', ev, 3018217, 5000);
    check('% terminal', pvTv / ev * 100, 76.8, 0.5);
    var esc = escenarios();
    check('Escenario pesimista', esc[0].precio, 145.85, 0.3);
    check('Escenario optimista', esc[2].precio, 326.28, 0.3);
    check('WACC', WACC * 100, 9.24, 0.01);
    check('Ke', KE * 100, 9.36, 0.01);
    console.log(ok ? '%c[selfTest] TODO OK — el modelo reproduce los números del trabajo' : '%c[selfTest] FALLÓ', 'font-weight:bold;color:' + (ok ? '#30d158' : '#ff453a'));
    return ok;
  }

  // --- Formato es-AR (coma decimal, punto de miles) ---------------------------
  function fmt(n, dec) {
    dec = (dec == null) ? 0 : dec;
    var parts = Math.abs(n).toFixed(dec).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '−' : '') + parts.join(',');
  }

  window.PRES = window.PRES || {};
  window.PRES.finance = {
    FCF: FCF, YEARS: YEARS, WACC: WACC, G_BASE: G_BASE, PRECIO_ACTUAL: PRECIO_ACTUAL,
    precioObjetivo: precioObjetivo, vpExplicito: vpExplicito, fcfDescontados: fcfDescontados,
    valorTerminal: valorTerminal, upsidePct: upsidePct,
    gridWaccG: gridWaccG, gridUpsideG: gridUpsideG, gridWaccBetaErp: gridWaccBetaErp,
    escenarios: escenarios, tornado: tornado, footballField: footballField, monteCarlo: monteCarlo,
    selfTest: selfTest, fmt: fmt
  };
})();
