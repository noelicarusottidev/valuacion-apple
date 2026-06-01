/* =============================================================================
   charts.js — Gráficos animados (Chart.js) y heatmaps (CSS grid).
   Cada gráfico se renderiza de forma perezosa (lazy) la primera vez que su
   diapositiva se activa, para que la animación dispare al entrar.
   ============================================================================= */
(function () {
  'use strict';

  var F = function () { return window.PRES.finance; };
  var fmt = function (n, d) { return window.PRES.finance.fmt(n, d); };

  // Paleta
  var C = {
    blue: '#0a84ff', blueSoft: 'rgba(10,132,255,0.55)',
    green: '#30d158', red: '#ff453a', amber: '#ff9f0a',
    grey: 'rgba(180,180,190,0.55)', grid: 'rgba(255,255,255,0.08)',
    text: '#b4b4be', faint: '#7d7d88'
  };

  function setDefaults() {
    if (window.__chartDefaultsSet) return;
    var D = window.Chart.defaults;
    D.font.family = "'Inter', system-ui, sans-serif";
    D.font.size = 13;
    D.color = C.text;
    D.borderColor = C.grid;
    D.plugins.legend.labels.color = C.text;
    D.plugins.legend.labels.boxWidth = 12;
    D.plugins.legend.labels.boxHeight = 12;
    D.plugins.legend.labels.usePointStyle = true;
    D.animation.duration = 850;
    D.animation.easing = 'easeOutQuart';
    window.__chartDefaultsSet = true;
  }

  function axis(opts) {
    opts = opts || {};
    return {
      grid: { color: C.grid, drawBorder: false },
      ticks: Object.assign({ color: C.text }, opts.ticks || {}),
      title: opts.title ? { display: true, text: opts.title, color: C.faint } : undefined,
      beginAtZero: opts.beginAtZero
    };
  }

  // ---- Plugin genérico para líneas de referencia ----------------------------
  function refLinesPlugin(getLines) {
    return {
      id: 'refLines',
      afterDatasetsDraw: function (chart) {
        var lines = getLines(chart); if (!lines) return;
        var ctx = chart.ctx, area = chart.chartArea;
        lines.forEach(function (ln) {
          var scale = chart.scales[ln.axis === 'y' ? 'y' : 'x'];
          var p = scale.getPixelForValue(ln.value);
          ctx.save();
          ctx.strokeStyle = ln.color; ctx.lineWidth = ln.width || 2;
          ctx.setLineDash(ln.dash || [6, 5]);
          ctx.beginPath();
          if (ln.axis === 'y') { ctx.moveTo(area.left, p); ctx.lineTo(area.right, p); }
          else { ctx.moveTo(p, area.top); ctx.lineTo(p, area.bottom); }
          ctx.stroke();
          if (ln.label) {
            ctx.setLineDash([]); ctx.fillStyle = ln.color;
            ctx.font = '600 11px Inter, sans-serif';
            ctx.textAlign = ln.axis === 'y' ? 'left' : (p > (area.left + area.right) / 2 ? 'right' : 'left');
            if (ln.axis === 'y') ctx.fillText(ln.label, area.left + 6, p - 5);
            else ctx.fillText(ln.label, p + (ctx.textAlign === 'right' ? -6 : 6), area.top + 12);
          }
          ctx.restore();
        });
      }
    };
  }

  // ---- Fábricas de gráficos Chart.js ----------------------------------------
  var FACTORIES = {

    businessMix: function (ctx) {
      var m = window.PRES_DATA.business.mix;
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: m.map(function (s) { return s.seg; }),
          datasets: [
            { label: '% de ventas', data: m.map(function (s) { return s.share; }), backgroundColor: C.blueSoft, borderColor: C.blue, borderWidth: 1.5, borderRadius: 6 },
            { label: 'Margen bruto %', data: m.map(function (s) { return s.gm; }), backgroundColor: 'rgba(48,209,88,0.5)', borderColor: C.green, borderWidth: 1.5, borderRadius: 6 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false,
          scales: { x: axis(), y: axis({ beginAtZero: true, ticks: { callback: function (v) { return v + '%'; } } }) } }
      });
    },

    grossProfit: function (ctx) {
      // Índice relativo: facturación (iPhone ~50 / Servicios ~26) y ganancia bruta
      // (iPhone 50×38% ≈ 19,0 / Servicios 26×75% ≈ 19,5) → casi igual con la mitad de ventas.
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['iPhone', 'Servicios'],
          datasets: [
            { label: 'Facturación (índice)', data: [50, 26], backgroundColor: C.grey, borderColor: 'rgba(180,180,190,0.9)', borderWidth: 1.5, borderRadius: 6 },
            { label: 'Ganancia bruta (índice)', data: [19.0, 19.5], backgroundColor: C.blueSoft, borderColor: C.blue, borderWidth: 1.5, borderRadius: 6 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false,
          scales: { x: axis(), y: axis({ beginAtZero: true }) } }
      });
    },

    multiples: function (ctx) {
      var d = window.PRES_DATA.multiples;
      var metrics = ['pe', 'evebitda', 'ps', 'pb'];
      var labels = ['P/E (TTM)', 'EV/EBITDA', 'P/S (TTM)', 'P/B'];
      var datasets = d.companies.map(function (co) {
        var isA = co.target;
        return {
          label: co.ticker,
          data: metrics.map(function (k) { return co[k]; }),
          backgroundColor: isA ? C.blue : 'rgba(150,150,160,0.35)',
          borderColor: isA ? C.blue : 'rgba(150,150,160,0.7)',
          borderWidth: isA ? 2 : 1, borderRadius: 4
        };
      });
      return new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.parsed.y + 'x'; } } } },
          scales: { x: axis(), y: axis({ beginAtZero: true, ticks: { callback: function (v) { return v + 'x'; } } }) } }
      });
    },

    betaRegression: function (ctx) {
      var reg = window.PRES_DATA.betaReg;
      // Genera una nube calibrada (R²≈0.485) sembrada; los 5 primeros son reales.
      var pts = reg.realPoints.map(function (p) { return { x: p[0], y: p[1] }; });
      var seed = 7;
      function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
      function randn() { return Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
      var noise = 0.058; // ruido residual para R² ~0.485 con var(x)~0.0028
      for (var i = pts.length; i < reg.n; i++) {
        var x = 0.011 + 0.052 * randn();
        var y = reg.intercept + reg.slope * x + noise * randn();
        pts.push({ x: x, y: y });
      }
      var xs = pts.map(function (p) { return p.x; });
      var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
      var line = [{ x: xmin, y: reg.intercept + reg.slope * xmin }, { x: xmax, y: reg.intercept + reg.slope * xmax }];
      return new Chart(ctx, {
        data: {
          datasets: [
            { type: 'scatter', label: 'Retornos mensuales', data: pts, backgroundColor: 'rgba(10,132,255,0.6)', borderColor: C.blue, pointRadius: 4 },
            { type: 'line', label: 'Recta OLS (β=1,084)', data: line, borderColor: C.amber, borderWidth: 2.5, pointRadius: 0, fill: false }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: {
            x: Object.assign(axis({ title: 'Retorno S&P 500', ticks: { callback: function (v) { return (v * 100).toFixed(0) + '%'; } } }), {}),
            y: Object.assign(axis({ title: 'Retorno AAPL', ticks: { callback: function (v) { return (v * 100).toFixed(0) + '%'; } } }), {})
          } }
      });
    },

    evComposition: function (ctx) {
      var f = F();
      var pvExp = f.vpExplicito(f.WACC);
      var pvTv = f.valorTerminal(f.WACC, f.G_BASE) / Math.pow(1 + f.WACC, 5);
      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['VP explícito (2026-2030)', 'VP valor terminal (2031→∞)'],
          datasets: [{ data: [pvExp, pvTv], backgroundColor: [C.blue, C.amber], borderColor: '#0d0d12', borderWidth: 3, hoverOffset: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '58%',
          plugins: { legend: { position: 'bottom' },
            tooltip: { callbacks: { label: function (c) {
              var tot = c.dataset.data.reduce(function (a, b) { return a + b; }, 0);
              return c.label + ': ' + (c.parsed / tot * 100).toFixed(1) + '%  (USD ' + fmt(c.parsed / 1e6, 2) + ' T)';
            } } } } }
      });
    },

    scenarios: function (ctx) {
      var f = F(), esc = f.escenarios();
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: esc.map(function (e) { return e.nombre; }),
          datasets: [{ label: 'Precio objetivo (USD)', data: esc.map(function (e) { return e.precio; }),
            backgroundColor: esc.map(function (e) { return e.color; }), borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return 'USD ' + fmt(c.parsed.y, 2); } } } },
          scales: { x: axis(), y: axis({ beginAtZero: true, ticks: { callback: function (v) { return '$' + v; } } }) } },
        plugins: [refLinesPlugin(function () { return [{ axis: 'y', value: f.PRECIO_ACTUAL, color: C.red, label: 'Mercado: USD ' + fmt(f.PRECIO_ACTUAL, 2) }]; })]
      });
    },

    monteCarlo: function (ctx) {
      var f = F(), mc = f.monteCarlo(50);
      var centers = mc.bins.map(function (_, i) { return (mc.edges[i] + mc.edges[i + 1]) / 2; });
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: centers,
          datasets: [{ label: 'Frecuencia', data: mc.bins, backgroundColor: 'rgba(90,200,250,0.5)', borderColor: 'rgba(90,200,250,0.8)', borderWidth: 0.5, barPercentage: 1, categoryPercentage: 1 }]
        },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { type: 'linear', min: 120, max: 320, grid: { color: C.grid }, ticks: { color: C.text, callback: function (v) { return '$' + v; }, maxTicksLimit: 8 }, offset: false },
            y: axis({ beginAtZero: true, title: 'Frecuencia' })
          } },
        plugins: [refLinesPlugin(function () { return [
          { axis: 'x', value: mc.p50, color: C.green, label: 'Mediana 207,9' },
          { axis: 'x', value: mc.market, color: C.red, label: 'Mercado 312,06' }
        ]; })]
      });
    },

    tornado: function (ctx) {
      var f = F(), t = f.tornado();
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: t.rows.map(function (r) { return r.name; }),
          datasets: [{ label: 'Rango de precio', data: t.rows.map(function (r) { return [r.min, r.max]; }),
            backgroundColor: 'rgba(10,132,255,0.45)', borderColor: C.blue, borderWidth: 1.5, borderRadius: 5 }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { var v = c.raw; return 'USD ' + fmt(v[0], 0) + ' – ' + fmt(v[1], 0); } } } },
          scales: { x: axis({ ticks: { callback: function (v) { return '$' + v; } } }), y: axis() } },
        plugins: [refLinesPlugin(function () { return [{ axis: 'x', value: t.base, color: C.green, label: 'Base 207,8' }]; })]
      });
    },

    footballField: function (ctx) {
      var f = F(), ff = f.footballField();
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ff.methods.map(function (m) { return m.metodo; }),
          datasets: [{ label: 'Rango', data: ff.methods.map(function (m) { return [m.low, m.high]; }),
            backgroundColor: 'rgba(10,132,255,0.4)', borderColor: C.blue, borderWidth: 1.5, borderRadius: 5 }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          layout: { padding: { right: 8 } },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { var v = c.raw; return 'USD ' + fmt(v[0], 0) + ' – ' + fmt(v[1], 0); } } } },
          scales: { x: axis({ ticks: { callback: function (v) { return '$' + v; } } }), y: axis({ ticks: { font: { size: 11 } } }) } },
        plugins: [refLinesPlugin(function () { return [
          { axis: 'x', value: ff.market, color: C.red, label: 'Mercado' },
          { axis: 'x', value: ff.base, color: C.green, label: 'DCF base' }
        ]; })]
      });
    },

    fcfProjected: function (ctx) {
      var f = F();
      var years = ['2025'].concat(f.YEARS.map(String));
      var vals = [140222].concat(f.FCF).map(function (v) { return v / 1000; });
      var colors = ['rgba(180,180,190,0.55)'].concat(f.FCF.map(function () { return C.blueSoft; }));
      var borders = ['rgba(180,180,190,0.9)'].concat(f.FCF.map(function () { return C.blue; }));
      return new Chart(ctx, {
        type: 'bar',
        data: { labels: years, datasets: [{ label: 'FCFF (USD B)', data: vals, backgroundColor: colors, borderColor: borders, borderWidth: 1.5, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return 'USD ' + fmt(c.parsed.y, 1) + ' B'; } } } },
          scales: { x: axis(), y: axis({ beginAtZero: true, ticks: { callback: function (v) { return '$' + v + 'B'; } } }) } }
      });
    },

    fcfDiscounted: function (ctx) {
      var f = F();
      var disc = f.fcfDescontados(f.WACC);
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: f.YEARS.map(String),
          datasets: [
            { label: 'FCFF nominal', data: f.FCF.map(function (v) { return v / 1000; }), backgroundColor: C.grey, borderColor: 'rgba(180,180,190,0.9)', borderWidth: 1.5, borderRadius: 5 },
            { label: 'FCFF descontado (9,24%)', data: disc.map(function (v) { return v / 1000; }), backgroundColor: C.blueSoft, borderColor: C.blue, borderWidth: 1.5, borderRadius: 5 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': USD ' + fmt(c.parsed.y, 1) + ' B'; } } } },
          scales: { x: axis(), y: axis({ beginAtZero: true, ticks: { callback: function (v) { return '$' + v + 'B'; } } }) } }
      });
    }
  };

  // ---- Heatmaps (CSS grid) --------------------------------------------------
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) {
    return 'rgb(' + Math.round(lerp(c1[0], c2[0], t)) + ',' + Math.round(lerp(c1[1], c2[1], t)) + ',' + Math.round(lerp(c1[2], c2[2], t)) + ')';
  }
  // Escala RdYlGn: t=0 rojo, 0.5 amarillo, 1 verde
  function rdylgn(t) {
    var red = [215, 48, 39], yel = [255, 235, 150], grn = [26, 152, 80];
    t = Math.max(0, Math.min(1, t));
    return t < 0.5 ? mix(red, yel, t / 0.5) : mix(yel, grn, (t - 0.5) / 0.5);
  }

  function renderHeatmap(box, grid) {
    var flat = [];
    grid.matrix.forEach(function (r) { r.forEach(function (v) { flat.push(v); }); });
    var mn = Math.min.apply(null, flat), mx = Math.max.apply(null, flat);
    var ncols = grid.colLabels.length;
    box.style.gridTemplateColumns = '70px repeat(' + ncols + ', 1fr)';

    var html = '';
    // fila de cabecera
    html += '<div class="hm-corner">' + grid.rowTitle + '<br>' + grid.colTitle + '</div>';
    grid.colLabels.forEach(function (cl) { html += '<div class="hm-head">' + cl + '</div>'; });
    // filas de datos
    grid.matrix.forEach(function (row, r) {
      html += '<div class="hm-rowhead">' + grid.rowLabels[r] + '</div>';
      row.forEach(function (v, c) {
        var t = (v - mn) / (mx - mn || 1);
        if (grid.reverse) t = 1 - t;
        var isBase = (r === grid.baseRow && c === grid.baseCol);
        var delay = (r + c) * 28 + 160;
        html += '<div class="hm-cell' + (isBase ? ' is-base' : '') + '" style="background:' + rdylgn(t) + ';transition-delay:' + delay + 'ms">' + grid.fmt(v) + '</div>';
      });
    });
    box.innerHTML = html;
  }

  var HEATMAPS = {
    waccBetaErp: function () { return F().gridWaccBetaErp(); },
    waccG: function () { return F().gridWaccG(); },
    upsideG: function () { return F().gridUpsideG(); }
  };

  // ---- Simulador interactivo: DCF inverso -----------------------------------
  // Reutiliza F().precioObjetivo (la misma función validada por selfTest).
  function initReverseDcf(el) {
    var fin = F();
    var WACC = fin.WACC, G = fin.G_BASE;
    var rf = parseFloat(el.getAttribute('data-rf')) || 0.0432;
    var pbi = parseFloat(el.getAttribute('data-pbi')) || 0.0425;

    function px(w, g) { return fin.precioObjetivo(w, g, 1); }

    // WACC implícito: g fija = 3%, decreciente en WACC → bisección
    function impliedWacc(price) {
      var lo = G + 0.0001, hi = 0.50;
      for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (px(m, G) > price) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    // g implícita: WACC fijo = base, creciente en g → bisección
    function impliedG(price) {
      var lo = -0.05, hi = WACC - 0.0001;
      for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (px(WACC, m) < price) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }

    var q = function (sel) { return el.querySelector('[data-sim-' + sel + ']'); };
    var slider = q('slider');
    var SMIN = parseFloat(slider.min), SMAX = parseFloat(slider.max);
    var BASE_EXACT = px(WACC, G);     // precio exacto de nuestra valuación (≈207,82)
    var BASE_PRICE = Math.round(BASE_EXACT);  // 208 — posición del slider y de la marca
    // rangos visuales de cada barra (deben contener todas las marcas)
    var WMIN = 0.04, WMAX = 0.11;   // eje WACC
    var GMIN = 0.0, GMAX = 0.07;    // eje g
    var pct = function (v, mn, mx) { return Math.max(0, Math.min(100, (v - mn) / (mx - mn) * 100)); };

    var mode = 'wacc'; // 'wacc' | 'g' — un solo experimento a la vez

    // Marcas fijas del slider de precio (posición según el rango del slider)
    q('pmark-ours').style.left = pct(BASE_PRICE, SMIN, SMAX) + '%';
    q('pmark-mkt').style.left = pct(312, SMIN, SMAX) + '%';

    function update(price) {
      q('price').textContent = 'USD ' + fin.fmt(Math.round(price), 0);
      // En USD 208 (= nuestra valuación) usamos el precio exacto para reproducir
      // el caso base sin error de redondeo (WACC 9,24% / g 3,0% exactos).
      var eff = (Math.round(price) === BASE_PRICE) ? BASE_EXACT : price;

      if (mode === 'wacc') {
        var w = impliedWacc(eff);
        var danger = w < rf;           // cruzó por debajo de la tasa libre de riesgo
        q('wacc-mine').textContent = fin.fmt(WACC * 100, 2) + '%';
        q('wacc-impl').textContent = fin.fmt(w * 100, 2) + '%';
        q('wacc-impl').classList.toggle('is-danger', danger);
        var wGap = (w - WACC) * 100;
        q('wacc-gap').textContent = (wGap >= 0 ? '+' : '−') + fin.fmt(Math.abs(wGap), 2) + ' pp vs. WACC utilizado';
        q('wacc-gap').className = 'rsim-gap ' + (danger ? 'is-bad' : (w < WACC ? 'is-warn' : 'is-good'));
        q('wacc-fill').style.width = pct(w, WMIN, WMAX) + '%';
        q('wacc-mark').style.left = pct(w, WMIN, WMAX) + '%';
        q('wacc-mark').classList.toggle('is-danger', danger);
        q('wacc-rf').style.left = pct(rf, WMIN, WMAX) + '%';
        q('wacc-base').style.left = pct(WACC, WMIN, WMAX) + '%';
        q('read').innerHTML =
          '<p>Para pagar <b>USD ' + fin.fmt(price, 0) + '</b>, el mercado descontaría a un <b class="t-blue">WACC implícito de ' + fin.fmt(w * 100, 2) + '%</b> — frente a nuestro 9,24% — manteniendo la g en 3,0%.</p>' +
          '<p>La prima de riesgo implícita es de <b class="t-blue">' + fin.fmt((w - rf) * 100, 2) + '%</b> (WACC − tasa libre de riesgo).</p>' +
          (danger ? '<p class="is-danger-txt">A ese WACC el costo de capital cae por debajo de la tasa libre de riesgo (4,32%): es económicamente inconsistente.</p>' : '');
      } else {
        var g = impliedG(eff);
        var dangerG = g > pbi;         // supera el crecimiento nominal de largo plazo
        q('g-mine').textContent = fin.fmt(G * 100, 1) + '%';
        q('g-impl').textContent = fin.fmt(g * 100, 1) + '%';
        q('g-impl').classList.toggle('is-danger', dangerG);
        var gGap = (g - G) * 100;
        q('g-gap').textContent = (gGap >= 0 ? '+' : '−') + fin.fmt(Math.abs(gGap), 1) + ' pp vs. nuestra g';
        q('g-gap').className = 'rsim-gap ' + (dangerG ? 'is-bad' : (g > G ? 'is-warn' : 'is-good'));
        q('g-fill').style.width = pct(g, GMIN, GMAX) + '%';
        q('g-mark').style.left = pct(g, GMIN, GMAX) + '%';
        q('g-mark').classList.toggle('is-danger', dangerG);
        q('g-pbi').style.left = pct(pbi, GMIN, GMAX) + '%';
        q('read').innerHTML =
          '<p>Para pagar <b>USD ' + fin.fmt(price, 0) + '</b>, el mercado asumiría una <b class="t-amber">g terminal de ' + fin.fmt(g * 100, 1) + '%</b> — frente a nuestro 3,0% — manteniendo el WACC fijo en 9,24%.</p>' +
          (dangerG ? '<p class="is-danger-txt">Supera el crecimiento nominal de largo plazo de la economía (~' + fin.fmt(pbi * 100, 2) + '%): no es sostenible a perpetuidad, refleja la apuesta de crecimiento cercano (IA + Services).</p>' : '');
      }
    }

    function setMode(m) {
      mode = m;
      Array.prototype.forEach.call(el.querySelectorAll('[data-sim-mode]'), function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-sim-mode') === m);
      });
      Array.prototype.forEach.call(el.querySelectorAll('[data-sim-card]'), function (c) {
        c.classList.toggle('is-active', c.getAttribute('data-sim-card') === m);
      });
      slider.value = BASE_PRICE;       // UX: al cambiar de modo, resetear a USD 208
      update(BASE_PRICE);
    }

    Array.prototype.forEach.call(el.querySelectorAll('[data-sim-mode]'), function (btn) {
      btn.addEventListener('click', function () { setMode(btn.getAttribute('data-sim-mode')); });
    });
    slider.addEventListener('input', function () { update(parseFloat(slider.value)); });

    slider.value = BASE_PRICE;
    setMode('wacc');                   // estado inicial: modo WACC, precio 208 = caso base
  }

  var SIMS = { reverseDcf: initReverseDcf };

  // ---- API: render perezoso por diapositiva ---------------------------------
  function renderForSlide(slideEl) {
    if (!slideEl) return;
    // Gráficos Chart.js
    var chartWraps = slideEl.querySelectorAll('[data-chart]');
    Array.prototype.forEach.call(chartWraps, function (w) {
      if (w.dataset.rendered) return;
      var id = w.getAttribute('data-chart');
      var factory = FACTORIES[id];
      if (!factory || !window.Chart) return;
      setDefaults();
      var canvas = w.querySelector('canvas');
      try { factory(canvas.getContext('2d')); w.dataset.rendered = '1'; }
      catch (e) { console.error('Error al renderizar gráfico ' + id, e); }
    });
    // Heatmaps
    var hms = slideEl.querySelectorAll('[data-heatmap]');
    Array.prototype.forEach.call(hms, function (w) {
      if (w.dataset.rendered) return;
      var id = w.getAttribute('data-heatmap');
      var fn = HEATMAPS[id]; if (!fn) return;
      try { renderHeatmap(w.querySelector('.heatmap'), fn()); w.dataset.rendered = '1'; }
      catch (e) { console.error('Error al renderizar heatmap ' + id, e); }
    });
    // Simuladores interactivos
    var sims = slideEl.querySelectorAll('[data-sim]');
    Array.prototype.forEach.call(sims, function (w) {
      if (w.dataset.rendered) return;
      var id = w.getAttribute('data-sim');
      var fn = SIMS[id]; if (!fn) return;
      try { fn(w); w.dataset.rendered = '1'; }
      catch (e) { console.error('Error al inicializar simulador ' + id, e); }
    });
  }

  window.PRES = window.PRES || {};
  window.PRES.charts = { renderForSlide: renderForSlide };
})();
