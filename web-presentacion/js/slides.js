/* =============================================================================
   slides.js — Genera el DOM de cada diapositiva a partir de PRES_DATA.
   Todo el contenido proviene de nuestros propios datos (confiable) → se usa
   innerHTML con templates. Cada bloque de nivel superior recibe [data-animate].
   ============================================================================= */
(function () {
  'use strict';

  function esc(s) { return String(s == null ? '' : s); }
  // marca de animación escalonada
  function anim(i) { return ' data-animate style="--i:' + i + '"'; }

  // ---- Render de un bloque de contenido -> string HTML ----------------------
  function block(b, i) {
    var a = anim(i);
    switch (b.type) {
      case 'lead':
        return '<p class="lead"' + a + '>' + esc(b.text) + '</p>';
      case 'paragraph':
        return '<p class="paragraph' + (b.small ? ' small' : '') + '"' + a + '>' + esc(b.text) + '</p>';
      case 'subhead':
        return '<div class="subhead"' + a + '>' + esc(b.text) + '</div>';
      case 'tag':
        return '<span class="tag"' + a + '>' + esc(b.text) + '</span>';
      case 'source':
        return '<div class="source"' + a + '>' + esc(b.text) + '</div>';

      case 'hero':
        return '<div class="hero-num' + (b.accent ? ' accent-' + b.accent : '') + '"' + a + '>' +
          '<div class="hero-value">' + esc(b.value) + '</div>' +
          (b.label ? '<div class="hero-label">' + esc(b.label) + '</div>' : '') +
          (b.sub ? '<div class="hero-sub">' + esc(b.sub) + '</div>' : '') +
          '</div>';

      case 'stats': {
        var cols = b.cols || b.items.length;
        var cards = b.items.map(function (it) {
          return '<div class="stat-card' + (it.accent ? ' accent-' + it.accent : '') + '">' +
            '<div class="stat-value">' + esc(it.value) + '</div>' +
            '<div class="stat-label">' + esc(it.label) + '</div>' +
            (it.desc ? '<div class="stat-desc">' + esc(it.desc) + '</div>' : '') +
            '</div>';
        }).join('');
        return '<div class="stats" style="--cols:' + cols + '"' + a + '>' + cards + '</div>';
      }

      case 'cards': {
        var cc = b.cols || 3;
        var items = b.items.map(function (it) {
          return '<div class="card">' +
            '<div class="card-title">' + esc(it.title) + '</div>' +
            (it.sub ? '<div class="card-sub">' + esc(it.sub) + '</div>' : '') +
            '<div class="card-text">' + esc(it.text) + '</div>' +
            '</div>';
        }).join('');
        return '<div class="cards" style="--cols:' + cc + '"' + a + '>' + items + '</div>';
      }

      case 'columns': {
        var ncol = b.cols.length;
        var cols2 = b.cols.map(function (c) {
          var lis = c.items.map(function (it) {
            return '<div class="li">' + (it.label ? '<b>' + esc(it.label) + ':</b> ' : '') + esc(it.text) + '</div>';
          }).join('');
          return '<div class="column' + (c.tone ? ' tone-' + c.tone : '') + '">' +
            (c.eyebrow ? '<div class="col-eyebrow">' + esc(c.eyebrow) + '</div>' : '') +
            (c.title ? '<div class="col-title">' + esc(c.title) + '</div>' : '') +
            '<div class="col-list">' + lis + '</div>' +
            '</div>';
        }).join('');
        return '<div class="columns' + (b.dense ? ' dense' : '') + '" style="--cols:' + ncol + '"' + a + '>' + cols2 + '</div>';
      }

      case 'bullets': {
        var bl = b.items.map(function (it) {
          return '<div class="bullet">' +
            (it.label ? '<div class="b-label">' + esc(it.label) + '</div>' : '') +
            '<div class="b-text">' + esc(it.text) + '</div>' +
            '</div>';
        }).join('');
        return '<div class="bullets' + (b.ranked ? ' ranked' : '') + '"' + a + '>' + bl + '</div>';
      }

      case 'note':
        return '<div class="note' + (b.accent ? ' accent-' + b.accent : '') + '"' + a + '>' +
          (b.title ? '<div class="note-title">' + esc(b.title) + '</div>' : '') +
          '<div class="note-text">' + esc(b.text) + '</div>' +
          '</div>';

      case 'formula':
        return '<div class="formula"' + a + '>' + b.html + '</div>';

      case 'verdict':
        return '<div class="verdict"' + a + '>' +
          '<div class="verdict-big">' + esc(b.big) + '</div>' +
          '<div class="verdict-text">' + esc(b.text) + '</div>' +
          '</div>';

      case 'table': {
        var head = '<tr>' + b.head.map(function (h, idx) {
          return '<th' + (idx > 0 ? ' class="num"' : '') + '>' + esc(h) + '</th>';
        }).join('') + '</tr>';
        var hi = b.highlight || [];
        var body = b.rows.map(function (row, ri) {
          var cells = row.map(function (cell, ci) {
            var numlike = ci > 0 && /^[−\-+]?[\d$]|%$|x$|^USD/.test(String(cell).trim());
            return '<td' + (numlike ? ' class="num"' : '') + '>' + esc(cell) + '</td>';
          }).join('');
          return '<tr' + (hi.indexOf(ri) >= 0 ? ' class="is-highlight"' : '') + '>' + cells + '</tr>';
        }).join('');
        return '<table class="data-table"' + a + '><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
      }

      case 'chart':
        return '<div class="chart-wrap" data-chart="' + b.chartId + '"' + a + '>' +
          '<div class="chart-canvas-box"><canvas></canvas></div>' +
          (b.caption ? '<div class="chart-caption">' + esc(b.caption) + '</div>' : '') +
          '</div>';

      case 'heatmap':
        return '<div class="heatmap-wrap" data-heatmap="' + b.chartId + '"' + a + '>' +
          '<div class="heatmap"></div>' +
          (b.caption ? '<div class="chart-caption">' + esc(b.caption) + '</div>' : '') +
          '</div>';

      case 'reverseSim': {
        var rf = (b.rfMark != null ? b.rfMark : 0.0432);
        var pbi = (b.pbiMark != null ? b.pbiMark : 0.0425);
        return '<div class="rsim" data-sim="reverseDcf" data-rf="' + rf + '" data-pbi="' + pbi + '"' + a + '>' +
          // Selector de modo (un solo experimento a la vez)
          '<div class="rsim-modes" role="tablist">' +
            '<button class="rsim-mode is-active" data-sim-mode="wacc" type="button">Ajuste vía WACC</button>' +
            '<button class="rsim-mode" data-sim-mode="g" type="button">Ajuste vía g terminal</button>' +
          '</div>' +
          // Control: slider de precio de mercado (con marcas fijas 208 / 312)
          '<div class="rsim-control">' +
            '<div class="rsim-control-head">' +
              '<span class="rsim-control-label">Precio de mercado</span>' +
              '<span class="rsim-price" data-sim-price>USD 208</span>' +
            '</div>' +
            '<input class="rsim-slider" type="range" min="150" max="450" step="1" value="208" data-sim-slider aria-label="Precio de mercado">' +
            '<div class="rsim-pmarks">' +
              '<div class="rsim-pmark rsim-pmark-ours" data-sim-pmark-ours><span class="rsim-pmark-dot"></span><span class="rsim-pmark-lbl">Nuestra valuación<b>USD 208</b></span></div>' +
              '<div class="rsim-pmark rsim-pmark-mkt" data-sim-pmark-mkt><span class="rsim-pmark-dot"></span><span class="rsim-pmark-lbl">Mercado hoy<b>USD 312</b></span></div>' +
            '</div>' +
          '</div>' +
          // Card WACC (visible solo en modo wacc)
          '<div class="rsim-card rsim-card-wacc is-active" data-sim-card="wacc">' +
            '<div class="rsim-card-head">' +
              '<div class="rsim-card-title">WACC implícito del mercado</div>' +
              '<div class="rsim-fixed"><span class="rsim-lock">🔒</span> g terminal: fija en 3,0%</div>' +
            '</div>' +
            '<div class="rsim-compare">' +
              '<div class="rsim-mine"><span class="rsim-mtag">Nuestro supuesto</span><span class="rsim-mval" data-sim-wacc-mine>9,24%</span></div>' +
              '<span class="rsim-arrow">→</span>' +
              '<div class="rsim-impl rsim-impl-wacc"><span class="rsim-itag">Implícito del mercado</span><span class="rsim-ival" data-sim-wacc-impl>9,24%</span></div>' +
            '</div>' +
            '<div class="rsim-gap" data-sim-wacc-gap></div>' +
            '<div class="rsim-bar">' +
              '<div class="rsim-bar-fill rsim-bar-fill-wacc" data-sim-wacc-fill></div>' +
              '<div class="rsim-mark rsim-mark-impl" data-sim-wacc-mark><span class="rsim-mark-dot"></span></div>' +
              '<div class="rsim-mark rsim-mark-ref" data-sim-wacc-rf><span class="rsim-mark-line"></span><span class="rsim-mark-lbl">Rf 4,32%</span></div>' +
              '<div class="rsim-mark rsim-mark-ref2" data-sim-wacc-base><span class="rsim-mark-line"></span><span class="rsim-mark-lbl">WACC utilizado</span></div>' +
            '</div>' +
          '</div>' +
          // Card g (visible solo en modo g)
          '<div class="rsim-card rsim-card-g" data-sim-card="g">' +
            '<div class="rsim-card-head">' +
              '<div class="rsim-card-title">g terminal implícita del mercado</div>' +
              '<div class="rsim-fixed"><span class="rsim-lock">🔒</span> WACC: fijo en 9,24%</div>' +
            '</div>' +
            '<div class="rsim-compare">' +
              '<div class="rsim-mine"><span class="rsim-mtag">Nuestro supuesto</span><span class="rsim-mval" data-sim-g-mine>3,0%</span></div>' +
              '<span class="rsim-arrow">→</span>' +
              '<div class="rsim-impl rsim-impl-g"><span class="rsim-itag">Implícito del mercado</span><span class="rsim-ival" data-sim-g-impl>3,0%</span></div>' +
            '</div>' +
            '<div class="rsim-gap" data-sim-g-gap></div>' +
            '<div class="rsim-bar">' +
              '<div class="rsim-bar-fill rsim-bar-fill-g" data-sim-g-fill></div>' +
              '<div class="rsim-mark rsim-mark-impl" data-sim-g-mark><span class="rsim-mark-dot"></span></div>' +
              '<div class="rsim-mark rsim-mark-danger" data-sim-g-pbi><span class="rsim-mark-line"></span><span class="rsim-mark-lbl">PBI nominal LP 4,25%</span></div>' +
            '</div>' +
          '</div>' +
          // Texto interpretativo (se actualiza solo, según el modo activo)
          '<div class="rsim-read" data-sim-read></div>' +
        '</div>';
      }

      case 'monteCarloSim': {
        return '<div class="mcsim" data-sim="monteCarloSim"' + a + '>' +
          // Escenario: histograma en canvas + overlay del botón / contador
          '<div class="mcsim-stage">' +
            '<canvas class="mcsim-canvas" data-mc-canvas></canvas>' +
            '<div class="mcsim-overlay" data-mc-overlay>' +
              '<button class="mcsim-run" type="button" data-mc-run>Correr 10.000 escenarios</button>' +
            '</div>' +
            '<div class="mcsim-counter" data-mc-counter aria-hidden="true"></div>' +
            '<button class="mcsim-skip" type="button" data-mc-skip aria-hidden="true">saltar al resultado</button>' +
          '</div>' +
          // Resultado (oculto hasta terminar la animación)
          '<div class="mcsim-result" data-mc-result aria-hidden="true">' +
            '<div class="mcsim-pct" data-mc-pct>0%</div>' +
            '<div class="mcsim-lead" data-mc-lead></div>' +
            '<div class="mcsim-foot" data-mc-foot></div>' +
            '<button class="mcsim-rerun" type="button" data-mc-rerun>↻ Correr de nuevo</button>' +
          '</div>' +
        '</div>';
      }

      case 'scenarios': {
        var ax = b.axis || { min: 120, max: 340, ticks: [] };
        var span = (ax.max - ax.min) || 1;
        var posPct = function (v) { return ((v - ax.min) / span * 100).toFixed(2); };
        // Tarjetas (una por escenario)
        var scards = b.items.map(function (it) {
          var params = (it.params || []).map(function (p) {
            return '<li><span>' + esc(p[0]) + '</span><b>' + esc(p[1]) + '</b></li>';
          }).join('');
          var neg = /^[−-]/.test(String(it.ret));
          return '<article class="scn-card tone-' + esc(it.tone) + (it.base ? ' is-base' : '') + '">' +
            '<header class="scn-card-head">' +
              '<span class="scn-name">' + esc(it.name) + '</span>' +
              (it.base ? '<span class="scn-badge">caso base</span>' : '') +
            '</header>' +
            '<div class="scn-price">' + esc(it.priceLabel) + '</div>' +
            '<div class="scn-ret ' + (neg ? 'is-neg' : 'is-pos') + '">' +
              '<span class="scn-arrow">' + (neg ? '▾' : '▴') + '</span>' +
              '<span class="scn-ret-num">' + esc(it.ret) + '</span>' +
              '<span class="scn-cap">vs. mercado</span>' +
            '</div>' +
            '<ul class="scn-params">' + params + '</ul>' +
          '</article>';
        }).join('');
        // Número-línea: marcador de mercado + un punto por escenario + eje
        var dots = b.items.map(function (it) {
          return '<span class="scn-dot tone-' + esc(it.tone) + '" style="left:' + posPct(it.price) + '%">' +
            '<i></i><em>' + esc(it.priceLabel.replace('USD ', '')) + '</em></span>';
        }).join('');
        var mkt = '<span class="scn-mkt" style="left:' + posPct(b.market) + '%">' +
          '<em>' + esc(b.marketLabel || ('Mercado · USD ' + b.market)) + '</em><i></i></span>';
        var ticks = (ax.ticks || []).map(function (t) {
          return '<span class="scn-tick" style="left:' + posPct(t) + '%">$' + t + '</span>';
        }).join('');
        return '<div class="scn"' + a + '>' +
          '<div class="scn-cards">' + scards + '</div>' +
          '<div class="scn-range">' +
            '<div class="scn-track">' + mkt + dots + '</div>' +
            '<div class="scn-axis">' + ticks + '</div>' +
          '</div>' +
          (b.note ? '<div class="scn-note">' + esc(b.note) + '</div>' : '') +
        '</div>';
      }

      case 'splitBar': {
        var totalPct = b.segments.reduce(function (s, x) { return s + (x.pct || 0); }, 0) || 100;
        var segs = b.segments.map(function (s) {
          return '<div class="sb-seg tone-' + esc(s.tone) + '" style="flex:0 0 ' + (s.pct / totalPct * 100) + '%">' +
            '<div class="sb-lab">' + esc(s.label) + '</div>' +
            (s.sub ? '<div class="sb-sub">' + esc(s.sub) + '</div>' : '') +
          '</div>';
        }).join('');
        return '<div class="splitbar"' + a + '>' +
          (b.title ? '<div class="sb-title">' + esc(b.title) + '</div>' : '') +
          '<div class="sb-bar">' + segs + '</div>' +
        '</div>';
      }

      case 'peScale': {
        var mx = b.max || 38, rf = b.ref || 20;
        var basePct = (rf / mx * 100).toFixed(2);          // tramo base 0→ref
        var primaPct = ((mx - rf) / mx * 100).toFixed(2);  // tramo prima ref→max
        return '<div class="pe-wrap"' + a + '>' +
          '<div class="pe">' +
            // flanco izquierdo: interpretación
            '<div class="pe-side pe-side-l"><p class="pe-interp">' + esc(b.interp) + '</p></div>' +
            // columna vertebral: héroe arriba + (escala + barra) abajo
            '<div class="pe-spine">' +
              '<div class="pe-hero"><div class="pe-hero-num">' + esc(b.hero) + '</div>' +
                '<div class="pe-hero-lab">' + esc(b.heroLabel) + '</div></div>' +
              '<div class="pe-gauge">' +
                '<div class="pe-ticks">' +
                  '<span class="pe-tick" style="bottom:100%">' + esc(mx) + 'x</span>' +
                  '<span class="pe-tick" style="bottom:' + basePct + '%">' + esc(rf) + 'x</span>' +
                  '<span class="pe-tick pe-tick-0" style="bottom:0">0x</span>' +
                '</div>' +
                '<div class="pe-bar">' +
                  '<div class="pe-seg pe-prima" style="flex:0 0 ' + primaPct + '%">' +
                    '<span class="pe-seg-tag">' + esc(b.prima.tag) + '</span>' +
                    '<span class="pe-seg-txt">' + esc(b.prima.text) + '</span></div>' +
                  '<div class="pe-seg pe-base" style="flex:0 0 ' + basePct + '%">' +
                    '<span class="pe-seg-tag">' + esc(b.base.tag) + '</span>' +
                    '<span class="pe-seg-txt">' + esc(b.base.text) + '</span></div>' +
                  '<div class="pe-ref" style="bottom:' + basePct + '%"><span class="pe-ref-lab">' + esc(b.refLabel) + '</span></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // flanco derecho: riesgo (anclado a la zona prima)
            '<div class="pe-side pe-side-r"><div class="pe-risk"><span class="pe-risk-dot"></span>' +
              '<p><span class="pe-risk-h">El riesgo.</span> ' + esc(b.risk) + '</p></div></div>' +
          '</div>' +
          '<div class="pe-foot">' + esc(b.foot) + '</div>' +
        '</div>';
      }

      default:
        return '';
    }
  }

  function blocks(arr, start) {
    start = start || 0;
    return arr.map(function (b, i) { return block(b, start + i); }).join('');
  }

  // ---- Render de una diapositiva completa -----------------------------------
  function renderSlide(s) {
    var L = s.layout;
    var inner = '';

    if (L === 'cover') {
      // Subtítulo: separar la parte del ticker para destacarla en dorado
      var subParts = String(s.subtitle || '').split(' · (');
      var subHtml = subParts.length === 2
        ? '<span>' + esc(subParts[0]) + '</span><span aria-hidden="true">·</span><span class="cv-ticker">(' + esc(subParts[1]) + '</span>'
        : '<span>' + esc(s.subtitle) + '</span>';
      inner =
        '<div class="cv-orb"></div>' +
        '<div class="cv-corner cv-tl"></div><div class="cv-corner cv-br"></div>' +
        '<svg class="cv-apple" viewBox="0 0 128 128" aria-hidden="true">' +
          '<path fill="currentColor" d="M88.6 67.7c-.1-13.2 10.8-19.6 11.3-19.9-6.2-9.1-15.9-10.4-19.3-10.5-8.2-.8-16 4.8-20.2 4.8-4.1 0-10.5-4.7-17.3-4.6-8.9.1-17.1 5.2-21.7 13.2-9.3 16.1-2.4 39.9 6.7 53 4.4 6.4 9.7 13.7 16.6 13.4 6.7-.3 9.2-4.3 17.2-4.3 8 0 10.3 4.3 17.4 4.2 7.2-.1 11.7-6.5 16.1-12.9 5.1-7.4 7.2-14.6 7.3-15-.2-.1-14-5.4-14.1-21.4z"/>' +
          '<path fill="currentColor" d="M75.2 28.6c3.7-4.5 6.2-10.7 5.5-16.9-5.3.2-11.8 3.5-15.6 8-3.4 3.9-6.4 10.2-5.6 16.2 5.9.5 12-3 15.7-7.3z"/>' +
        '</svg>' +
        '<div class="slide-body">' +
          '<div class="cv-topline"' + anim(0) + '>' + esc(s.eyebrow) + '</div>' +
          '<div class="cv-body-row">' +
            '<div class="cv-hero">' +
              '<h1 class="cv-title"' + anim(1) + '>' + esc(s.title) + '</h1>' +
              '<div class="cv-subtitle"' + anim(2) + '>' + subHtml + '</div>' +
              '<p class="cv-desc"' + anim(3) + '>' + esc(s.lead) + '</p>' +
            '</div>' +
            '<aside class="cv-card"' + anim(4) + ' aria-label="Gráfico financiero decorativo">' +
              '<div class="cv-card-head"><span>Intrinsic Value</span><span class="cv-card-dot"></span></div>' +
              '<svg viewBox="0 0 290 170" aria-hidden="true">' +
                '<defs>' +
                  '<linearGradient id="cvArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#d7b56d" stop-opacity="0.42"/><stop offset="100%" stop-color="#d7b56d" stop-opacity="0"/></linearGradient>' +
                  '<linearGradient id="cvStroke" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#7da7ff"/><stop offset="100%" stop-color="#d7b56d"/></linearGradient>' +
                '</defs>' +
                '<g stroke="rgba(247,243,234,0.13)" stroke-width="1"><path d="M16 26H274"/><path d="M16 66H274"/><path d="M16 106H274"/><path d="M16 146H274"/><path d="M32 14V154"/><path d="M96 14V154"/><path d="M160 14V154"/><path d="M224 14V154"/></g>' +
                '<path d="M18 139 C45 126, 58 119, 78 121 C104 123, 111 91, 135 94 C160 97, 165 70, 190 71 C219 72, 224 45, 272 30 L272 154 L18 154 Z" fill="url(#cvArea)"/>' +
                '<path d="M18 139 C45 126, 58 119, 78 121 C104 123, 111 91, 135 94 C160 97, 165 70, 190 71 C219 72, 224 45, 272 30" fill="none" stroke="url(#cvStroke)" stroke-width="4" stroke-linecap="round"/>' +
                '<g fill="#f7f3ea"><circle cx="78" cy="121" r="4"/><circle cx="135" cy="94" r="4"/><circle cx="190" cy="71" r="4"/><circle cx="272" cy="30" r="4"/></g>' +
                '<g fill="rgba(247,243,234,0.55)" font-family="Inter, sans-serif" font-size="10" font-weight="700"><text x="18" y="166">FCF</text><text x="220" y="166">Terminal Value</text></g>' +
              '</svg>' +
              '<div class="cv-formula"><span><strong>EV</strong><br>Σ FCF / (1+WACC)^t</span><span><strong>Equity</strong><br>EV − Debt + Cash</span></div>' +
            '</aside>' +
          '</div>' +
          '<footer class="cv-footer"' + anim(5) + '><span>' + s.meta.map(function (m) { return esc(m); }).join(' · ') + '</span></footer>' +
        '</div>';
    } else if (L === 'section') {
      inner =
        '<div class="slide-body">' +
        '<div class="section-rule"' + anim(0) + '></div>' +
        '<div class="section-kicker"' + anim(1) + '>' + esc(s.kicker) + '</div>' +
        '<div class="section-title"' + anim(2) + '>' + esc(s.title) + '</div>' +
        '<div class="section-lead"' + anim(3) + '>' + esc(s.lead) + '</div>' +
        '</div>';
    } else if (L === 'closing') {
      var src = s.sources;
      inner =
        '<div class="slide-body">' +
        '<div class="eyebrow"' + anim(0) + '>' + esc(s.title) + '</div>' +
        '<div class="closing-quote"' + anim(1) + '><span class="mark">“</span>' + esc(s.quote) + '<span class="mark">”</span></div>' +
        '<div class="closing-sources"' + anim(2) + '>' +
        '<h4>' + esc(src.title) + '</h4>' +
        '<ul>' + src.items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') + '</ul>' +
        '</div>' +
        (src.thanks ? '<div class="closing-thanks"' + anim(3) + '>' + esc(src.thanks) + '</div>' : '') +
        '</div>';
    } else {
      // Cabecera estándar
      var head =
        '<div class="slide-head">' +
        '<div class="slide-title"' + anim(0) + '>' + esc(s.title) + '</div>' +
        (s.subtitle ? '<div class="slide-sub"' + anim(0) + '>' + esc(s.subtitle) + '</div>' : '') +
        '</div>';

      var body;
      if (L === 'split') {
        body = '<div class="slide-body">' +
          '<div class="col-left">' + blocks(s.left || [], 1) + '</div>' +
          '<div class="col-right">' + blocks(s.right || [], 1 + (s.left ? s.left.length : 0)) + '</div>' +
          '</div>';
      } else {
        body = '<div class="slide-body">' + blocks(s.blocks || [], 1) + '</div>';
      }

      var foot = '<div class="slide-foot">' +
        '<span>' + esc(window.PRES_DATA.footerLabel) + '</span>' +
        (s.footer ? '<span class="foot-num">' + esc(s.footer) + '</span>' : '<span></span>') +
        '</div>';

      inner = head + body + foot;
    }

    var section = document.createElement('section');
    section.className = 'slide layout-' + L + (s.cls ? ' ' + s.cls : '');
    section.id = s.id;
    section.setAttribute('aria-label', 'Diapositiva ' + s.num + (s.title ? ': ' + s.title : ''));
    section.setAttribute('role', 'group');
    section.innerHTML = inner;
    return section;
  }

  window.PRES = window.PRES || {};
  window.PRES.slides = { renderSlide: renderSlide };
})();
