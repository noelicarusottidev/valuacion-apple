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
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    D.animation.duration = reduce ? 0 : 850;
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
      function vgrad(top, bot) {
        return function (c) {
          var a = c.chart.chartArea; if (!a) return bot;
          var g = c.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
          g.addColorStop(0, top); g.addColorStop(1, bot); return g;
        };
      }
      var pctLabels = {
        id: 'bizValueLabels',
        afterDatasetsDraw: function (chart) {
          var c2 = chart.ctx;
          chart.data.datasets.forEach(function (ds, di) {
            var meta = chart.getDatasetMeta(di); if (meta.hidden) return;
            meta.data.forEach(function (bar, i) {
              var v = ds.data[i]; if (v == null) return;
              c2.save();
              c2.fillStyle = '#fff'; c2.font = '700 12px Inter, system-ui, sans-serif';
              c2.textAlign = 'center'; c2.textBaseline = 'bottom';
              c2.fillText(Math.round(v) + '%', bar.x, bar.y - 4);
              c2.restore();
            });
          });
        }
      };
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: m.map(function (s) { return s.seg; }),
          datasets: [
            { label: '% de ventas', data: m.map(function (s) { return s.share; }),
              backgroundColor: vgrad('rgba(10,132,255,0.35)', 'rgba(10,132,255,0.95)'), borderColor: C.blue, borderWidth: 0, borderRadius: 8, borderSkipped: false, categoryPercentage: 0.56, barPercentage: 0.82, maxBarThickness: 86 },
            { label: 'Margen bruto %', data: m.map(function (s) { return s.gm; }),
              backgroundColor: vgrad('rgba(48,209,88,0.32)', 'rgba(48,209,88,0.92)'), borderColor: C.green, borderWidth: 0, borderRadius: 8, borderSkipped: false, categoryPercentage: 0.56, barPercentage: 0.82, maxBarThickness: 86 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false,
          layout: { padding: { top: 16 } },
          plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
            tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.parsed.y + '%'; } } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: C.text, font: { size: 14, weight: '600' } } },
            y: { beginAtZero: true, suggestedMax: 100, grid: { color: C.grid, drawBorder: false }, ticks: { color: C.faint, stepSize: 25, callback: function (v) { return v + '%'; } } }
          } },
        plugins: [pctLabels]
      });
    },

    grossProfit: function (ctx) {
      // Índice relativo: facturación (iPhone ~50 / Servicios ~26) y ganancia bruta
      // (iPhone 50×38% ≈ 19,0 / Servicios 26×75% ≈ 19,5) → casi igual con la mitad de ventas.
      function vgrad(top, bot) {
        return function (c) {
          var a = c.chart.chartArea; if (!a) return bot;
          var g = c.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
          g.addColorStop(0, top); g.addColorStop(1, bot); return g;
        };
      }
      var idxLabels = {
        id: 'gpValueLabels',
        afterDatasetsDraw: function (chart) {
          var c2 = chart.ctx;
          chart.data.datasets.forEach(function (ds, di) {
            var meta = chart.getDatasetMeta(di); if (meta.hidden) return;
            meta.data.forEach(function (bar, i) {
              var v = ds.data[i]; if (v == null) return;
              var txt = (v % 1 === 0) ? String(v) : v.toFixed(1).replace('.', ',');
              c2.save();
              c2.fillStyle = '#fff'; c2.font = '700 12px Inter, system-ui, sans-serif';
              c2.textAlign = 'center'; c2.textBaseline = 'bottom';
              c2.fillText(txt, bar.x, bar.y - 4);
              c2.restore();
            });
          });
        }
      };
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['iPhone', 'Servicios'],
          datasets: [
            { label: 'Facturación (índice)', data: [50, 26],
              backgroundColor: vgrad('rgba(150,150,160,0.28)', 'rgba(150,150,160,0.78)'), borderWidth: 0, borderRadius: 8, borderSkipped: false, categoryPercentage: 0.56, barPercentage: 0.82, maxBarThickness: 86 },
            { label: 'Ganancia bruta (índice)', data: [19.0, 19.5],
              backgroundColor: vgrad('rgba(10,132,255,0.35)', 'rgba(10,132,255,0.95)'), borderWidth: 0, borderRadius: 8, borderSkipped: false, categoryPercentage: 0.56, barPercentage: 0.82, maxBarThickness: 86 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false,
          layout: { padding: { top: 16 } },
          plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
            tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.parsed.y; } } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: C.text, font: { size: 14, weight: '600' } } },
            y: { beginAtZero: true, suggestedMax: 56, grid: { color: C.grid, drawBorder: false }, ticks: { display: false } }
          } },
        plugins: [idxLabels]
      });
    },

    multiples: function (ctx) {
      var d = window.PRES_DATA.multiples;
      var keys = ['pe', 'evebitda', 'evfcf'];
      var labels = d.metrics; // ['P/E (TTM)', 'EV/EBITDA', 'EV/FCF']
      // Color propio y consistente por empresa; AAPL la más destacada.
      var FILL = { AAPL: 'rgba(10,132,255,0.95)', MSFT: 'rgba(90,200,250,0.72)', GOOGL: 'rgba(155,135,245,0.72)', META: 'rgba(246,162,60,0.74)' };
      var LINE = { AAPL: '#0a84ff', MSFT: '#5ac8fa', GOOGL: '#9b87f5', META: '#f6a23c' };
      var datasets = d.companies.map(function (co) {
        var isA = !!co.target;
        return {
          label: co.ticker,
          data: keys.map(function (k) { return co[k]; }),
          backgroundColor: FILL[co.ticker] || 'rgba(150,150,160,0.55)',
          borderColor: LINE[co.ticker] || 'rgba(150,150,160,0.85)',
          borderWidth: isA ? 2.5 : 1, borderRadius: 5, borderSkipped: false,
          categoryPercentage: 0.72, barPercentage: 0.86, _isA: isA
        };
      });
      // Autoescala con espacio para las etiquetas (GOOGL ~70x entra cómodo)
      var maxV = 0;
      d.companies.forEach(function (co) { keys.forEach(function (k) { if (co[k] > maxV) maxV = co[k]; }); });
      var ymax = Math.ceil(maxV * 1.12 / 5) * 5;

      // Plugin: valor numérico ("37x") encima de cada barra
      var valueLabels = {
        id: 'multiplesValueLabels',
        afterDatasetsDraw: function (chart) {
          var c2 = chart.ctx;
          chart.data.datasets.forEach(function (ds, di) {
            var meta = chart.getDatasetMeta(di);
            if (meta.hidden) return;
            meta.data.forEach(function (bar, i) {
              var v = ds.data[i]; if (v == null) return;
              c2.save();
              c2.fillStyle = ds._isA ? '#ffffff' : 'rgba(214,214,224,0.9)';
              c2.font = (ds._isA ? '700 ' : '600 ') + '11px Inter, system-ui, sans-serif';
              c2.textAlign = 'center'; c2.textBaseline = 'bottom';
              c2.fillText(Math.round(v) + 'x', bar.x, bar.y - 3);
              c2.restore();
            });
          });
        }
      };

      return new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          layout: { padding: { top: 14 } },
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
            tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.parsed.y + 'x'; } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: C.text, font: { size: 13, weight: '600' } } },
            y: { beginAtZero: true, suggestedMax: ymax, grid: { color: C.grid, drawBorder: false },
                 ticks: { color: C.faint, callback: function (v) { return v + 'x'; } } }
          }
        },
        plugins: [valueLabels]
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
      var tvPct = Math.round(pvTv / (pvExp + pvTv) * 100);
      function sliceGrad(c1, c2) {
        return function (c) {
          var a = c.chart.chartArea; if (!a) return c2;
          var g = c.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
          g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
        };
      }
      // Número grande en el centro + % sobre cada gajo
      var evLabels = {
        id: 'evLabels',
        afterDatasetsDraw: function (chart) {
          var c2 = chart.ctx, meta = chart.getDatasetMeta(0);
          var cx = (chart.chartArea.left + chart.chartArea.right) / 2;
          var cy = (chart.chartArea.top + chart.chartArea.bottom) / 2;
          c2.save(); c2.textAlign = 'center'; c2.textBaseline = 'middle';
          c2.fillStyle = '#ffce7a'; c2.font = '800 48px Inter, system-ui, sans-serif';
          c2.fillText(tvPct + '%', cx, cy - 10);
          c2.fillStyle = C.faint; c2.font = '600 13px Inter, system-ui, sans-serif';
          c2.fillText('valor terminal', cx, cy + 22);
          c2.restore();
          var data = chart.data.datasets[0].data, tot = data.reduce(function (a, b) { return a + b; }, 0);
          meta.data.forEach(function (arc, i) {
            var ang = (arc.startAngle + arc.endAngle) / 2;
            var r = (arc.innerRadius + arc.outerRadius) / 2;
            c2.save(); c2.textAlign = 'center'; c2.textBaseline = 'middle';
            c2.fillStyle = 'rgba(8,10,16,0.92)'; c2.font = '800 19px Inter, system-ui, sans-serif';
            c2.fillText(Math.round(data[i] / tot * 100) + '%', arc.x + Math.cos(ang) * r, arc.y + Math.sin(ang) * r);
            c2.restore();
          });
        }
      };
      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['VP explícito (2026-2030)', 'VP valor terminal (2031→∞)'],
          datasets: [{ data: [pvExp, pvTv],
            backgroundColor: [sliceGrad('#5ac8fa', '#0a84ff'), sliceGrad('#ffce7a', '#ff9f0a')],
            borderColor: '#0d0d12', borderWidth: 4, borderRadius: 8, hoverOffset: 12, spacing: 2 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '66%',
          layout: { padding: 8 },
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 18 } },
            tooltip: { callbacks: { label: function (c) {
              var tot = c.dataset.data.reduce(function (a, b) { return a + b; }, 0);
              return c.label + ': ' + (c.parsed / tot * 100).toFixed(1) + '%  (USD ' + fmt(c.parsed / 1e6, 2) + ' T)';
            } } } } },
        plugins: [evLabels]
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
          '<p>Para pagar <b>USD ' + fin.fmt(price, 0) + '</b>, el mercado descontaría a un <b class="t-blue">WACC implícito de ' + fin.fmt(w * 100, 2) + '%</b> — frente a nuestro 9,24% — con la g fija en 3,0%.</p>' +
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

  // ---- Simulador interactivo: Monte Carlo (histograma en canvas) ------------
  // Reutiliza F().monteCarloTri() (semilla fija → reproducible) y dibuja el
  // histograma a mano sobre un <canvas> para animar las barras llenándose.
  function initMonteCarloSim(el) {
    var fin = F();
    var sim = fin.monteCarloTri();                       // instantáneo, semilla fija
    var MKT = sim.market;                                // 312,06
    var OURS = fin.precioObjetivo(fin.WACC, fin.G_BASE); // ≈ 207,82

    // Binning fijo (cubre el soporte triangular y ambas líneas de referencia)
    var XMIN = 120, XMAX = 340, NB = 33;
    var counts = new Array(NB).fill(0);
    sim.prices.forEach(function (p) {
      var idx = Math.floor((p - XMIN) / (XMAX - XMIN) * NB);
      if (idx >= 0 && idx < NB) counts[idx]++;
    });
    var maxCount = Math.max.apply(null, counts) || 1;
    var modeIdx = counts.indexOf(maxCount);   // barra más alta (la moda) → glow
    var P50 = sim.p50;                         // pivote del gradiente narrativo
    var abovePct = Math.max(0, 100 - sim.pctBelow); // % que supera el mercado (~6)

    var canvas = el.querySelector('[data-mc-canvas]');
    var ctx = canvas.getContext('2d');
    var PAD = { l: 18, r: 18, t: 40, b: 42 };
    var W = 800, H = 360;

    function size() {
      var dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth || el.clientWidth || 800;
      H = canvas.clientHeight || 360;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function xPix(price) {
      var pL = PAD.l, pR = W - PAD.r;
      return pL + (price - XMIN) / (XMAX - XMIN) * (pR - pL);
    }
    function roundedTopRect(x, y, w, h, r) {
      if (h <= 0) return;
      r = Math.min(r, w / 2, h);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
    }
    function vLine(x, yT, yB, color, lw, dash) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(x, yT); ctx.lineTo(x, yB); ctx.stroke();
      ctx.restore();
    }
    function tag(x, y, text, color, align, alpha, size) {
      ctx.save();
      ctx.globalAlpha = (alpha == null ? 1 : alpha);
      ctx.font = '700 ' + (size || 17) + 'px Inter, system-ui, sans-serif';
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      ctx.textAlign = align === 'right' ? 'right' : (align === 'center' ? 'center' : 'left');
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 1; // legible sobre las barras
      ctx.fillText(text, x + (align === 'right' ? -8 : (align === 'center' ? 0 : 8)), y);
      ctx.restore();
    }

    function lerp(a, b, t) {
      t = Math.max(0, Math.min(1, t));
      return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
    }
    function rgba(c, al) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al + ')'; }

    // --- Espectro narrativo a lo largo del eje X -------------------------------
    // El ojo recorre la campana: cian frío en valores bajos → azul/índigo vibrante
    // en la mediana (el grueso de la masa) → violeta → magenta al acercarse a la
    // línea roja → ámbar/dorado intenso en la cola que SUPERA el mercado (> 312):
    // la "zona segura" se vuelve "zona cara".
    var GOLD = [255, 176, 32];
    var STOPS = [
      { p: XMIN, c: [34, 211, 238] },  // cian
      { p: 184,  c: [56, 138, 255] },  // azul vibrante (subiendo hacia la moda)
      { p: P50,  c: [99, 102, 248] },  // índigo/azul-violáceo en la mediana
      { p: 272,  c: [150, 92, 246] },  // violeta
      { p: MKT,  c: [232, 92, 158] }   // magenta justo antes de los 312
    ];
    function barColor(center) {
      if (center >= MKT) return GOLD;                                        // ámbar/dorado: único acento cálido (supera el mercado)
      for (var s = 1; s < STOPS.length; s++) {
        if (center <= STOPS[s].p) return lerp(STOPS[s - 1].c, STOPS[s].c, (center - STOPS[s - 1].p) / (STOPS[s].p - STOPS[s - 1].p));
      }
      return STOPS[STOPS.length - 1].c;
    }

    // progress = altura de barras [0..1]; pulse = glow de la línea de mercado [0..1]
    // labelAlpha = opacidad de las etiquetas de las líneas (se atenúan al correr)
    function draw(progress, pulse, labelAlpha) {
      if (labelAlpha == null) labelAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      var pL = PAD.l, pR = W - PAD.r, pT = PAD.t, pB = H - PAD.b, plotH = pB - pT;
      var xMkt = xPix(MKT);

      // Grilla horizontal tenue
      ctx.strokeStyle = 'rgba(255,255,255,0.055)'; ctx.lineWidth = 1;
      for (var gy = 0; gy <= 4; gy++) {
        var y = Math.round(pT + plotH * gy / 4) + 0.5;
        ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(pR, y); ctx.stroke();
      }
      // Eje base
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.moveTo(pL, pB + 0.5); ctx.lineTo(pR, pB + 0.5); ctx.stroke();

      // Ticks de precio en el eje X
      var ticks = [120, 160, 200, 240, 280, 320];
      ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ticks.forEach(function (t) {
        var x = xPix(t);
        ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.moveTo(x, pB); ctx.lineTo(x, pB + 4); ctx.stroke();
        ctx.fillStyle = 'rgba(180,180,194,0.85)'; ctx.fillText('$' + t, x, pB + 9);
      });

      // Barras — gradiente vertical (saturado y luminoso en la base, suave arriba),
      // esquinas redondeadas, gap mínimo, borde superior brillante y glow en la moda.
      var bw = (pR - pL) / NB, gap = 1, r = 3.5;
      for (var i = 0; i < NB; i++) {
        if (counts[i] === 0) continue;
        var h = counts[i] / maxCount * plotH * progress;
        if (h < 0.5) continue;
        var x0 = pL + i * bw + gap / 2, w = bw - gap;
        var center = XMIN + (i + 0.5) / NB * (XMAX - XMIN);
        var col = barColor(center);
        var top = pB - h;
        var grad = ctx.createLinearGradient(0, top, 0, pB);
        grad.addColorStop(0, rgba(col, 0.34));
        grad.addColorStop(0.5, rgba(col, 0.78));
        grad.addColorStop(1, rgba(lerp(col, [255, 255, 255], 0.12), 1));
        ctx.save();
        if (i === modeIdx) { ctx.shadowColor = rgba(col, 0.95); ctx.shadowBlur = 22 * progress; }
        ctx.fillStyle = grad;
        roundedTopRect(x0, top, w, h, Math.min(r, w / 2));
        ctx.restore();
        // Borde superior brillante (cap luminoso)
        if (h > r + 1) {
          ctx.strokeStyle = rgba(lerp(col, [255, 255, 255], 0.55), 0.95);
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x0 + r, top + 0.7); ctx.lineTo(x0 + w - r, top + 0.7); ctx.stroke();
        }
      }

      // Rótulo sobre la zona ámbar (solo al terminar), en dos líneas para que
      // no se corte contra el borde derecho.
      if (pulse > 0 && abovePct > 0 && xMkt < pR - 24) {
        var l1 = '~' + Math.round(abovePct) + '% supera', l2 = 'el mercado';
        ctx.save(); ctx.font = '700 16px Inter, system-ui, sans-serif';
        var halfW = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) / 2;
        ctx.restore();
        var cx = (xMkt + pR) / 2;
        cx = Math.min(cx, pR - halfW - 4);   // no cortar por la derecha
        cx = Math.max(cx, xMkt + halfW + 4); // ni pisar la línea de mercado
        var ly = pT + plotH * 0.22;
        tag(cx, ly, l1, '#ffc24d', 'center', 1, 16);
        tag(cx, ly + 20, l2, '#ffc24d', 'center', 1, 16);
      }

      // Línea "Nuestra valuación" (fina y discreta)
      vLine(xPix(OURS), pT, pB, 'rgba(48,209,88,0.45)', 1.25, [3, 4]);
      tag(xPix(OURS), 4, 'Nuestra valuación · USD 208', '#5cf08a', 'left', labelAlpha, 17);

      // Línea "Mercado · USD 312" (gruesa, protagonista, con glow persistente + pulso)
      ctx.save();
      ctx.shadowColor = C.red; ctx.shadowBlur = 8 + 24 * pulse;
      vLine(xMkt, pT - 2, pB, C.red, 3.5, null);
      ctx.restore();
      tag(xMkt, 4, 'Mercado · USD 312', '#ff7a72', 'right', Math.max(labelAlpha, 0.9), 17);
    }

    // --- Estados y animación ---
    var overlay = el.querySelector('[data-mc-overlay]');
    var counterEl = el.querySelector('[data-mc-counter]');
    var skipEl = el.querySelector('[data-mc-skip]');
    var resultEl = el.querySelector('[data-mc-result]');
    var pctEl = el.querySelector('[data-mc-pct]');
    var leadEl = el.querySelector('[data-mc-lead]');
    var footEl = el.querySelector('[data-mc-foot]');
    var runBtn = el.querySelector('[data-mc-run]');
    var rerunBtn = el.querySelector('[data-mc-rerun]');
    var DUR = 2500, raf = null, state = 'idle';
    var pctDec = (sim.pctBelow >= 100 ? 0 : 1);

    function easeOut(t) { return 1 - Math.pow(1 - t, 4); } // quart: arranca rápido, frena suave al final

    function showIdle() {
      state = 'idle';
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      overlay.classList.remove('is-hidden');
      counterEl.classList.remove('is-on');
      skipEl.classList.remove('is-on');
      resultEl.classList.remove('is-on'); resultEl.setAttribute('aria-hidden', 'true');
      size(); draw(0, 0);
    }

    function reveal() {
      state = 'done';
      counterEl.classList.remove('is-on');
      skipEl.classList.remove('is-on');
      draw(1, 1);
      resultEl.classList.add('is-on'); resultEl.setAttribute('aria-hidden', 'false');
      leadEl.innerHTML = 'de los 10.000 escenarios queda por debajo del precio de mercado (USD 312)';
      footEl.innerHTML = 'Mediana <b>USD ' + fin.fmt(sim.p50, 2) + '</b>' +
        ' · rango P5–P95 <b>USD ' + fin.fmt(sim.p5, 2) + ' – ' + fin.fmt(sim.p95, 2) + '</b>';
      var t0 = performance.now(), pDur = 900;
      (function tick(now) {
        var t = Math.min(1, (now - t0) / pDur);
        pctEl.textContent = fin.fmt(sim.pctBelow * easeOut(t), pctDec) + '%';
        if (t < 1) requestAnimationFrame(tick);
        else pctEl.textContent = fin.fmt(sim.pctBelow, pctDec) + '%';
      })(t0);
    }

    function run() {
      state = 'running';
      overlay.classList.add('is-hidden');
      resultEl.classList.remove('is-on'); resultEl.setAttribute('aria-hidden', 'true');
      counterEl.classList.add('is-on');
      skipEl.classList.add('is-on');
      size();
      var start = performance.now();
      (function frame(now) {
        var raw = Math.min(1, (now - start) / DUR);
        var t = easeOut(raw);
        draw(t, 0, 0.28); // etiquetas atenuadas mientras corre, para que el contador respire
        counterEl.textContent = fin.fmt(Math.floor(10000 * t), 0);
        if (raw < 1) { raf = requestAnimationFrame(frame); }
        else { raf = null; counterEl.textContent = fin.fmt(10000, 0); reveal(); }
      })(start);
    }

    function skip() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      counterEl.textContent = fin.fmt(10000, 0);
      reveal();
    }

    runBtn.addEventListener('click', run);
    rerunBtn.addEventListener('click', run);
    skipEl.addEventListener('click', skip);
    window.addEventListener('resize', function () {
      size();
      if (state === 'idle') draw(0, 0);
      else if (state === 'done') draw(1, 1);
    });

    showIdle();
  }

  var SIMS = { reverseDcf: initReverseDcf, monteCarloSim: initMonteCarloSim };

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
