/* =============================================================================
   data.js — Fuente de verdad de la presentación.
   Contiene el texto literal y los números EXACTOS de las 43 diapositivas del
   pptx original "Valuacion Apple AAPL.pptx" (transcrito del notebook
   trabajo_completo.ipynb). No se altera ningún contenido ni cifra.

   Se carga como <script> clásico (sin módulos) para funcionar en file://.
   ============================================================================= */
(function () {
  'use strict';

  /* --- Datos numéricos exactos para los gráficos (del notebook) --------------- */

  // Múltiplos vs pares — P/E, EV/EBITDA y EV/FCF (TTM, may-2026)
  var MULTIPLES = {
    metrics: ['P/E (TTM)', 'EV/EBITDA', 'EV/FCF'],
    companies: [
      { ticker: 'AAPL',  name: 'Apple Inc.',            pe: 37.7, evebitda: 28.8, evfcf: 33, target: true },
      { ticker: 'MSFT',  name: 'Microsoft Corp.',       pe: 26.8, evebitda: 18.4, evfcf: 46 },
      { ticker: 'GOOGL', name: 'Alphabet Inc.',         pe: 29.0, evebitda: 28.4, evfcf: 70 },
      { ticker: 'META',  name: 'Meta Platforms',        pe: 23.0, evebitda: 14.7, evfcf: 32 }
    ],
    // promedio de pares (sin AAPL) por métrica
    avg: { pe: 26.3, evebitda: 20.5, evfcf: 49.3 }
  };

  // Regresión beta (CAPM) — celda 19/20: slope, intercept, R², n, y 5 puntos reales (SP500, AAPL)
  var BETA_REG = {
    slope: 1.0837, intercept: 0.005367, r2: 0.4849, n: 59,
    realPoints: [
      [0.022748, 0.064982], [0.028990, 0.040930], [-0.047569, -0.066640],
      [0.069144, 0.058657], [-0.008334, 0.103472]
    ]
  };

  // Modelo de negocio (narrativa de las slides 7-8): mix de ventas y márgenes
  var BUSINESS = {
    mix: [
      { seg: 'Productos', share: 74, gm: 38, color: '#5e9bd6' },
      { seg: 'Servicios', share: 26, gm: 75, color: '#34c759' }
    ]
  };

  /* --- Definición de las 43 diapositivas --------------------------------------- */

  var slides = [];

  // 1 — Portada
  slides.push({
    layout: 'cover',
    eyebrow: 'SEMINARIO · ¿CUÁNTO VALE UNA EMPRESA?',
    title: 'Valuación de Apple Inc.',
    subtitle: 'Flujos de Fondos Descontados · (AAPL · NASDAQ)',
    lead: 'Construcción íntegra de la tasa de descuento (WACC) + descuento de los flujos proyectados y valor terminal (Gordon-Shapiro), de Enterprise Value a precio objetivo por acción.',
    meta: ['Facultad de Ciencias Económicas — UNLP', 'Trabajo final · Valuación de empresas']
  });

  // 2 — Objetivos del proyecto (diseño dedicado)
  slides.push({
    layout: 'stack', footer: '02', cls: 'obj-slide',
    blocks: [
      { type: 'objGrid',
        kicker: 'Apple · Valuación financiera',
        titleSpan: 'Objetivos', titleRest: ' del proyecto',
        cards: [
          { icon: 'business',  title: 'Entender el modelo de negocio', html: 'Comprender cómo Apple genera valor.' },
          { icon: 'bars',      title: 'Valuación por múltiplos', html: 'Usar ratios contables para comparar a Apple contra su industria.' },
          { icon: 'rates',     title: 'Arquitectura de tasas', html: 'Determinar con precisión el costo de la deuda (<strong>Kd</strong>) y del accionista (<strong>Ke</strong>) vía CAPM.' },
          { icon: 'calc',      title: 'Cálculo del WACC', html: 'Tasa de descuento ponderada usando valores de mercado.' },
          { icon: 'intrinsic', title: 'Valuación intrínseca', html: 'Calcular <strong>Enterprise Value</strong> y <strong>Equity Value</strong> por acción.' },
          { icon: 'scenarios', title: 'Modelado de escenarios', html: 'Matrices de sensibilidad y simulaciones en Python.' }
        ],
        footerText: '<strong>Seminario de valuación</strong> · De la lógica económica del negocio al precio objetivo',
        pill: 'Objetivos metodológicos' }
    ]
  });

  // 3 — Sección Bloque 01
  slides.push({
    layout: 'section',
    kicker: 'BLOQUE 01 · CONTEXTO', title: 'Apple Inc. en un vistazo',
    lead: 'El negocio detrás de los números: de dónde viene la plata y por qué eso fija el múltiplo.'
  });

  // 6 — La empresa
  slides.push({
    layout: 'stack', footer: '04',
    title: 'La empresa', subtitle: 'El gigante que vamos a valuar',
    blocks: [
      { type: 'stats', items: [
        { value: 'USD 4,58 B', label: 'Capitalización de mercado' },
        { value: 'USD 312,06', label: 'Precio por acción' },
        { value: '37,7x', label: 'P/E (TTM)' },
        { value: '166.000', label: 'Empleados' }
      ]},
      { type: 'tag', text: 'Consumer Electronics · Technology' },
      { type: 'note', title: 'El ecosistema como foso', text: '>2.000 millones de dispositivos activos. El iPhone es la puerta de entrada; una vez dentro, Apple monetiza la base instalada con Servicios sin fabricar nada físico.' },
      { type: 'source', text: 'Datos: Yahoo Finance (en vivo)' }
    ]
  });

  // 7 — Modelo de negocio
  slides.push({
    layout: 'split', footer: '05',
    title: 'Modelo de negocio', subtitle: 'Servicios: el verdadero motor de rentabilidad',
    right: [ { type: 'chart', chartId: 'businessMix', caption: 'Mix de ventas y margen bruto por segmento' } ],
    left: [
      { type: 'columns', dense: true, cols: [
        { eyebrow: 'Productos · ~74% ventas', items: [
          { text: 'iPhone (~50% del total), Mac, iPad, Watch, AirPods.' },
          { text: '~38% margen bruto — lleva materiales, fábrica, logística.' }
        ]},
        { eyebrow: 'Servicios · ~26% ventas', items: [
          { text: 'App Store, iCloud, Music, TV+, AppleCare, Pay + acuerdo con Google.' },
          { text: '~75% margen bruto — costo marginal casi cero por usuario.' }
        ]}
      ]},
      { type: 'bullets', items: [
        { label: 'Expansión de margen', text: 'Servicios pasó de ~20% a ~26% del mix: más rentabilidad sin vender más hardware.' },
        { label: 'Ingresos recurrentes', text: 'Suscripciones estables vs. iPhone cíclico → menor riesgo → múltiplo más alto.' },
        { label: 'Colchón', text: 'Aunque el iPhone se estanque, la base instalada sigue generando Servicios.' }
      ]}
    ]
  });

  // 8 — El dato que manda
  slides.push({
    layout: 'split', footer: '06',
    title: 'El dato que manda', subtitle: 'En ganancia bruta, Servicios ya pesa casi como todo el iPhone',
    right: [ { type: 'chart', chartId: 'grossProfit', caption: 'Ventas vs. ganancia bruta (ilustrativo del mix narrado)' } ],
    left: [
      { type: 'lead', text: 'Servicios aporta casi tanta ganancia bruta como todo el iPhone, con la mitad de la facturación.' },
      { type: 'paragraph', text: 'Es el principal motor de rentabilidad de Apple — y lo que sostiene su prima de múltiplo.' },
      { type: 'note', accent: 'amber', title: 'Riesgo a monitorear', text: 'El acuerdo con Google (~USD 20 B/año, casi todo margen) lo paga por ser el buscador por defecto en Safari. Avalado por la Justicia en sept-2025, pero ya no es exclusivo, se renegocia cada año y Google apeló. Un cambio golpearía la parte más rentable del negocio.' }
    ]
  });

  // 9 — Sección Bloque 02
  slides.push({
    layout: 'section',
    kicker: 'BLOQUE 02 · VALUACIÓN RELATIVA', title: 'Análisis por múltiplos',
    lead: 'Una foto del precio que el mercado le pone hoy a empresas similares. No reemplaza al FFD: es un chequeo de razonabilidad.'
  });

  // 10 — Apple vs pares
  slides.push({
    layout: 'split', footer: '08',
    title: 'Apple vs pares (MSFT, GOOGL, META)',
    subtitle: 'Prima en P/E y EV/EBITDA — pero el EV/FCF cuenta otra historia',
    right: [ { type: 'chart', chartId: 'multiples', caption: 'Múltiplos de valuación (TTM, may-2026) · EV/FCF de MSFT y GOOGL comprimido por capex en IA; Apple invierte en IA vía I+D (récord histórico, >10% de ingresos), no capex.' } ],
    left: [
      { type: 'bullets', items: [
        { label: 'P/E y EV/EBITDA', text: 'Apple cotiza por encima de sus pares: el mercado paga más por cada peso de ganancia y de EBITDA.' },
        { label: 'El giro del EV/FCF', text: 'Acá MSFT y GOOGL aparecen más caras que Apple. Google, Meta y Microsoft están reinvirtiendo muchísimo en CapEx físico —data centers, servidores, GPUs, infraestructura cloud e IA—: menos caja libre, mayor EV/FCF.' },
        { label: 'La diferencia de Apple', text: 'Apple invierte en IA vía I+D (récord histórico, >10% de ingresos), no CapEx: su caja libre se mantiene alta y su EV/FCF, contenido.' }
      ]}
    ]
  });

  // 11 — La prima del P/E (la barra-escala como columna vertebral)
  slides.push({
    layout: 'stack', footer: '08', cls: 'pe-slide',
    title: 'La prima tiene fundamento, pero no es gratis',
    subtitle: 'Apple (AAPL) · valoración por múltiplos',
    blocks: [
      { type: 'peScale',
        hero: '38x', heroLabel: 'P/E (TTM) actual',
        max: 38, ref: 20,
        refLabel: 'Múltiplo histórico del mercado · S&P 500 ≈ 20x',
        prima: { tag: 'Prima', text: 'Crecimiento futuro descontado' },
        base:  { tag: 'Base',  text: 'Lo que el mercado paga por cualquier negocio sólido' },
        interp: 'Los inversores pagan unas 38 veces el beneficio anual: compran por adelantado años de crecimiento futuro.',
        risk: 'Si el crecimiento decepciona, el múltiplo se comprime y arrastra la cotización, aunque el negocio siga siendo sólido.',
        foot: '¿La prima ya descuenta demasiado? → lo responde el Flujo de Fondos Descontado (DCF)' }
    ]
  });

  // 12 — Sección Bloque 03
  slides.push({
    layout: 'section',
    kicker: 'BLOQUE 03 · COSTO DE CAPITAL', title: 'Arquitectura de tasas',
    lead: 'Kd, Ke y el camino al WACC. Acá viven varias de nuestras decisiones metodológicas más importantes.'
  });

  // 14 — Una sola fuente de verdad
  slides.push({
    layout: 'stack', footer: '10',
    title: 'Una sola fuente de verdad', subtitle: 'Parámetros de mercado: snapshot Damodaran abr-2026',
    blocks: [
      { type: 'stats', items: [
        { value: '4,32%', label: 'Risk-free (US Treasury 10Y)' },
        { value: '4,77%', label: 'ERP implícito (forward-looking)' },
        { value: '26 bps', label: 'Default spread (rating Aa1)' }
      ]},
      { type: 'note', accent: 'blue', title: 'Nuestra decisión: fijar un snapshot para que la valuación sea reproducible', text: 'Rf y ERP provienen del mismo modelo de Damodaran (ERP April-26). Los datos vivos (precio, deuda, acciones) se bajan de Yahoo Finance, así que el precio objetivo puede variar levemente según el día de corrida.' }
    ]
  });

  // 15 — Costo de la deuda
  slides.push({
    layout: 'split', footer: '11',
    title: 'Costo de la deuda (Kd)', subtitle: 'El método synthetic y el escudo fiscal',
    left: [
      { type: 'formula', html: 'Kd = Rf + spread' },
      { type: 'paragraph', text: 'Synthetic: 4,32% + 26 bps = 4,58%. Apple tiene rating de máxima calidad (Aa1/AA+), así que paga muy poco sobre el Treasury.' }
    ],
    right: [
      { type: 'note', accent: 'green', title: 'Decisiones nuestras', text: 'Usamos el costo marginal de fondeo hoy (no el contable, que mezcla deuda vieja) y la tasa impositiva efectiva promedio 4 años (17,66%), no la marginal.' },
      { type: 'hero', value: '3,77%', label: 'Kd después de impuestos = Kd · (1 − T)', accent: 'green' }
    ]
  });

  // 16 — CAPM · estimación de beta
  slides.push({
    layout: 'split', footer: '12',
    title: 'CAPM · estimación de Beta', subtitle: 'Regresión propia: AAPL contra el S&P 500',
    right: [ { type: 'chart', chartId: 'betaRegression', caption: 'Retornos mensuales AAPL vs S&P 500 (5 años, 59 obs.) + recta OLS' } ],
    left: [
      { type: 'stats', cols: 2, items: [
        { value: 'β = 1,084', label: 'Beta apalancado (OLS, 5 años mensual, 59 obs.)' },
        { value: 'R² = 0,485', label: 'El mercado explica ~48,5% de la varianza de Apple' }
      ]},
      { type: 'paragraph', text: 'β > 1: la acción amplifica los movimientos del índice. Es el punto de partida del costo del accionista.' }
    ]
  });

  // 17 — Decisión metodológica clave (Blume)
  slides.push({
    layout: 'stack', footer: '13',
    title: 'Decisión metodológica clave', subtitle: 'Por qué usamos el Beta de Blume, no el crudo',
    blocks: [
      { type: 'stats', cols: 2, items: [
        { value: '1,084', label: 'β crudo (regresión OLS)' },
        { value: '1,056', label: 'β de Blume → el que usamos en Ke', accent: 'green' }
      ]},
      { type: 'formula', html: 'Blume: 0,67 · β + 0,33' },
      { type: 'paragraph', text: 'Un beta de una sola regresión tiene error de estimación y tiende a revertir hacia 1. El ajuste de Blume corrige ese sesgo — es el estándar que reporta Bloomberg.' },
      { type: 'note', title: 'No reapalancamos', text: 'Con D/E ≈ 2,2%, desapalancar (Hamada) casi no mueve el beta: β_U ≈ 1,065. Lo calculamos solo como chequeo y valuamos a la estructura de capital actual.' }
    ]
  });

  // 18 — Costo del accionista (Ke)
  slides.push({
    layout: 'center', footer: '14',
    title: 'Costo del accionista (Ke)', subtitle: 'CAPM: lo que exige un inversor en Apple',
    blocks: [
      { type: 'hero', value: 'Ke = 9,36%', accent: 'blue' },
      { type: 'formula', html: '4,32%&nbsp;&nbsp;+&nbsp;&nbsp;1,056 × 4,77%' },
      { type: 'note', title: 'Por qué ERP implícito', text: 'El histórico (~5,5%) refleja el pasado; el implícito lo deriva Damodaran del precio actual del S&P y sus flujos esperados — es lo que el mercado descuenta hacia adelante, lo relevante para valuar.' }
    ]
  });

  // 19 — Sección Bloque 04
  slides.push({
    layout: 'section',
    kicker: 'BLOQUE 04 · TASA DE DESCUENTO', title: 'WACC — el cálculo final',
    lead: 'Ponderamos Ke y Kd por su peso a valor de mercado. Esta es la tasa con la que descontaremos todo.'
  });

  // 20 — Resultado de la parte 1
  slides.push({
    layout: 'center', footer: '15',
    title: 'Resultado de la Parte 1',
    blocks: [
      { type: 'hero', value: 'WACC = 9,24%', accent: 'green' },
      { type: 'stats', cols: 4, items: [
        { value: '9,36%', label: 'Ke' },
        { value: '3,77%', label: 'Kd (1−T)' },
        { value: '97,9%', label: 'Peso equity' },
        { value: '2,1%', label: 'Peso deuda' }
      ]},
      { type: 'note', accent: 'blue', title: 'Pesos a valor de mercado', text: 'Apple es ~98% equity: el WACC está dominado por el Ke. Por eso Beta y ERP son las palancas que más lo mueven.' }
    ]
  });

  // 21 — Sensibilidad de la tasa (heatmap WACC×β/ERP)
  slides.push({
    layout: 'split', footer: '16',
    title: 'Sensibilidad de la tasa', subtitle: '¿Cuánto se mueve el WACC ante β y ERP?',
    right: [ { type: 'heatmap', chartId: 'waccBetaErp', caption: 'WACC (%) según β (Blume) y ERP · recuadro = caso base' } ],
    left: [
      { type: 'bullets', items: [
        { label: 'Qué muestra', text: 'El recuadro azul es nuestro caso base (β 1,06 · ERP 4,8% → 9,24%). Moverse en la grilla cambia el WACC entre ~7,5% y ~11,5%.' },
        { label: 'Por qué importa', text: 'Como el 77% del valor estará en el valor terminal, cada décima del WACC mueve fuerte el precio objetivo. Por eso lo mostramos como rango, no como punto.' }
      ]}
    ]
  });

  // 22 — Sección Bloque 05
  slides.push({
    layout: 'section',
    kicker: 'BLOQUE 05 · VALUACIÓN INTRÍNSECA', title: 'Flujos de Fondos Descontados',
    lead: 'Con el WACC listo: descontamos los flujos, sumamos el valor terminal y bajamos de Enterprise Value a precio por acción.'
  });

  // 23 — La intuición del FFD
  slides.push({
    layout: 'stack', footer: '17',
    title: 'La intuición del FFD', subtitle: 'Una empresa vive infinitos años: partimos el cálculo en dos',
    blocks: [
      { type: 'columns', cols: [
        { eyebrow: '1 · Período explícito', title: '2026 – 2030', items: [
          { text: 'Cinco años con proyecciones detalladas (cátedra), cada flujo traído a valor presente al WACC.' }
        ]},
        { eyebrow: 'Continuidad', title: '2031 → ∞', items: [
          { text: 'Un solo número, el Valor Terminal: la empresa crece a una tasa estable g por toda la eternidad (Gordon-Shapiro).' }
        ]}
      ]},
      { type: 'formula', html: 'Enterprise Value&nbsp; = &nbsp;Σ FCF<sub>t</sub> / (1+WACC)<sup>t</sup>&nbsp;&nbsp; + &nbsp;&nbsp;TV<sub>2030</sub> / (1+WACC)<sup>5</sup>' }
    ]
  });

  // 24 — Los flujos a descontar
  slides.push({
    layout: 'split', footer: '18',
    title: 'Los flujos a descontar', subtitle: 'FCF proyectados — provistos por la cátedra',
    right: [ { type: 'chart', chartId: 'fcfDiscounted', caption: 'FCFF nominal vs. valor presente (USD billones)' } ],
    left: [
      { type: 'stats', cols: 1, items: [
        { value: '+9,26%', label: 'CAGR implícito en los flujos de la cátedra (2025→2030)', desc: 'De 153 a 218 mil M USD.', accent: 'green' }
      ]},
      { type: 'note', accent: 'amber', title: 'Supuesto optimista', text: 'Las proyecciones asumen un repunte del FCF (más Servicios de alto margen + ciclo de Apple Intelligence). Es un supuesto optimista pero no absurdo para Apple.' },
      { type: 'note', accent: 'blue', title: 'Valor del dinero en el tiempo', text: 'La barra gris es el flujo nominal; la azul, su valor presente. La brecha crece con el horizonte: cuanto más lejos el flujo, más lo penaliza el descuento.' }
    ]
  });

  // 25 — Período explícito
  slides.push({
    layout: 'center', footer: '20',
    title: 'Período explícito 2026-2030', subtitle: 'El valor presente de los cinco años',
    blocks: [
      { type: 'hero', value: 'USD 701 497 M', label: 'Valor presente del período explícito', accent: 'blue' },
      { type: 'note', title: 'Solo el 23% del valor', text: 'Descontar cada FCF al 9,24% reconoce el valor del dinero en el tiempo: un dólar dentro de 5 años vale menos hoy. Pero estos cinco años explican apenas ~un cuarto del Enterprise Value. El resto viene del valor terminal.' }
    ]
  });

  // 27 — Valor terminal · Gordon-Shapiro
  slides.push({
    layout: 'split', footer: '21', cls: 'tv-emphasis',
    title: 'Valor terminal · Gordon-Shapiro', subtitle: 'g = 3,0% — nuestra decisión más sensible',
    left: [
      { type: 'subhead', text: 'Por qué 3,0% y no más' },
      { type: 'table', head: ['Métrica', 'Valor'], rows: [
        ['Inflación objetivo Fed', '2,0%'],
        ['Crec. real US (largo plazo)', '~2,0%'],
        ['PIB nominal US', '~3,5–4,0%'],
        ['Risk-free (regla g ≤ Rf)', '4,32%']
      ]},
      { type: 'paragraph', small: true, text: 'Las dos restricciones: g < WACC (matemática) y g ≤ crecimiento de la economía. 3% reconoce un negocio maduro de alta calidad y respeta que ninguna empresa crece más que el PIB por siempre.' }
    ],
    right: [
      { type: 'hero', value: 'USD 3,60 B', label: 'Valor terminal al cierre de 2030', accent: 'amber' },
      { type: 'note', title: 'Cross-check múltiplo de salida', text: 'Implica 16,5x FCFF — razonable para un negocio maduro (Apple cotiza hoy a EV/EBITDA 28,8x).' },
      { type: 'hero', value: 'USD 2,32 B', label: 'VP del valor terminal (descontado 5 años)', accent: 'amber' }
    ]
  });

  // 28 — Enterprise Value
  slides.push({
    layout: 'split', footer: '22',
    title: 'Enterprise Value', subtitle: 'El 77% del valor vive en el valor terminal',
    right: [ { type: 'chart', chartId: 'evComposition', caption: 'Composición del Enterprise Value' } ],
    left: [
      { type: 'hero', value: 'USD 3,02 B', label: 'Enterprise Value', accent: 'blue' },
      { type: 'bullets', items: [
        { label: 'Composición', text: '23,2% período explícito · 76,8% valor terminal. Típico de empresas maduras y rentables.' },
        { label: 'El cuidado', text: 'Con tanto valor en el TV, la valuación es muy sensible a g y al WACC. La sensibilidad no es adorno: es el corazón.' }
      ]}
    ]
  });

  // 29 — De EV a precio por acción
  slides.push({
    layout: 'center', footer: '23',
    title: 'De Enterprise Value a precio por acción', subtitle: 'El puente — y el primer veredicto',
    blocks: [
      { type: 'note', accent: 'green', title: 'Sumamos la caja', text: 'Equity = EV − deuda neta. Apple tiene caja neta de +33,8 B, así que la caja se suma al valor del accionista.' },
      { type: 'stats', cols: 3, items: [
        { value: 'USD 207,80', label: 'Precio objetivo (DCF, caso base)', accent: 'green' },
        { value: 'USD 312,06', label: 'Precio de mercado actual' },
        { value: '−33,4%', label: 'Upside / (Downside)', accent: 'red' }
      ]}
    ]
  });

  // 30 — Sección Bloque 06
  slides.push({
    layout: 'section',
    kicker: 'BLOQUE 06 · ¿CUÁNTO VALE?', title: 'Sensibilidad, escenarios y veredicto',
    lead: 'No defendemos un número: defendemos un rango y mostramos dónde tiene que tener razón el mercado.'
  });

  // 31 — Sensibilidad WACC × g (heatmap precio)
  slides.push({
    layout: 'split', footer: '24',
    title: 'Sensibilidad WACC × g', subtitle: 'El precio objetivo no es un punto: es una grilla',
    right: [ { type: 'heatmap', chartId: 'waccG', caption: 'Precio objetivo (USD) · verde = más alto, rojo = más bajo' } ],
    left: [
      { type: 'bullets', items: [
        { label: 'Qué muestra', text: 'Cruzando WACC (filas) y g (columnas) el precio objetivo va de ~USD 150 a ~USD 340. Verde = más alto, rojo = más bajo.' },
        { label: 'El punto incómodo', text: 'Casi toda la grilla queda por debajo de los USD 312 del mercado. Solo combinaciones agresivas (WACC bajo + g alto) lo alcanzan.' }
      ]}
    ]
  });

  // 32 — DCF inverso (simulador interactivo)
  slides.push({
    layout: 'stack', footer: '26', cls: 'rsim-slide',
    title: 'DCF inverso: ¿Qué está descontando hoy el mercado?',
    blocks: [
      { type: 'reverseSim', rfMark: 0.0432, pbiMark: 0.0425 }
    ]
  });

  // 33 — Escenarios
  slides.push({
    layout: 'stack', footer: '25', cls: 'scn-slide',
    title: 'Escenarios',
    subtitle: 'Pesimista, base y optimista frente al precio de mercado',
    blocks: [
      { type: 'scenarios',
        market: 312.06, marketLabel: 'Mercado · USD 312',
        axis: { min: 120, max: 340, ticks: [120, 160, 200, 240, 280, 320] },
        items: [
          { name: 'Pesimista', tone: 'red', price: 145.85, priceLabel: 'USD 145,85', ret: '−53,3%',
            params: [['WACC', '+1 pp'], ['g', '2,0%'], ['FCF', '−10%']] },
          { name: 'Base', tone: 'blue', base: true, price: 207.80, priceLabel: 'USD 207,80', ret: '−33,4%',
            params: [['WACC', '9,24%'], ['g', '3,0%'], ['FCF', '100%']] },
          { name: 'Optimista', tone: 'green', price: 326.28, priceLabel: 'USD 326,28', ret: '+4,6%',
            params: [['WACC', '−1 pp'], ['g', '4,0%'], ['FCF', '+10%']] }
        ] }
    ]
  });

  // 34 — Monte Carlo (simulador interactivo en vivo)
  slides.push({
    layout: 'stack', footer: '27', cls: 'mcsim-slide',
    title: 'Simulación de Monte Carlo: 10.000 escenarios',
    subtitle: '¿Cuántos quedan por debajo del precio de mercado?',
    blocks: [
      { type: 'monteCarloSim' }
    ]
  });

  // 35 — Conclusión y recomendación
  slides.push({
    layout: 'stack', footer: '31',
    title: 'Conclusión y recomendación', subtitle: 'Veredicto: VENDER (Sell)',
    blocks: [
      { type: 'verdict', big: 'VENDER', text: 'El caso base queda 33% bajo el mercado' },
      { type: 'columns', cols: [
        { eyebrow: 'La tesis, con humildad', items: [
          { text: 'El modelo es función de los flujos que nos dieron. No decimos "el mercado se equivoca", sino dónde tiene que tener razón: el precio actual exige un g ≈ 5,4% que nuestras proyecciones no respaldan.' }
        ]},
        { eyebrow: 'Regulación', items: [
          { text: 'DMA (UE) y antitrust en EE.UU. — incl. el acuerdo con Google — presionan los márgenes de mayor calidad.' }
        ]},
        { eyebrow: 'China', items: [
          { text: 'Competencia local y exposición geopolítica presionan los volúmenes de iPhone.' }
        ]},
        { eyebrow: 'Catalizadores', tone: 'green', items: [
          { text: 'Apple Intelligence, ciclo de upgrade del iPhone y peso creciente de Servicios.' }
        ]}
      ]}
    ]
  });

  // 39 — En una frase + fuentes
  slides.push({
    layout: 'closing',
    title: 'En una frase',
    quote: 'La conclusión robusta no es que el mercado se equivoca, sino dónde tiene que tener razón para sostener el precio.',
    sources: {
      title: 'Fuentes principales',
      items: [
        'Damodaran, A. — Implied ERP, NYU Stern (abril 2026)',
        'Damodaran — tablas de spreads por rating crediticio',
        'Yahoo Finance (yfinance) — precios y estados financieros · Apple 10-K (SEC EDGAR)',
        'FCF proyectados — provistos por la cátedra'
      ],
      thanks: 'Gracias.'
    }
  });

  // 40 — Interpretación de la brecha (Modelo vs. Mercado) — diseño dedicado
  slides.push({
    layout: 'stack', footer: '33', cls: 'obj-slide gap-slide',
    blocks: [
      { type: 'gapAnalysis',
        kicker: 'Apple · Valuación DCF',
        titleSpan: 'Interpretación de la brecha:', titleRest: ' Modelo vs. Mercado',
        thesis: { label: 'Lectura central', leftName: 'Modelo', leftValue: 'DCF', rightName: 'Mercado', rightValue: 'Premio' },
        cards: [
          { variant: 'rate', icon: 'rate', eyebrow: 'Diferencial en la tasa', title: 'El mercado descuenta con menor WACC',
            metrics: [ { cls: 'model', label: 'Modelo', value: '9,24%' }, { cls: 'market', label: 'Mercado', value: '7,0–7,5%' } ],
            copy: 'El mercado cobra menos riesgo: aplica una <strong>prima de calidad</strong> por caja neta, alto retorno sobre capital e ingresos recurrentes.' },
          { variant: 'option', icon: 'option', eyebrow: 'Opción de compra', title: 'El mercado paga escenarios que el DCF no suma',
            copy: 'El DCF es <strong>estrictamente lineal</strong>: incorpora flujos esperados, no apuestas asimétricas de alto impacto hasta que sean un hecho.',
            quote: 'El precio incluye una "opción" sobre futuros posibles: súper-ciclo de ventas o boom en mercados emergentes.' },
          { variant: 'demand', icon: 'demand', eyebrow: 'Factores extrafundamentales', title: 'Demanda estructural que sostiene el precio',
            forces: [
              { h: 'Flujos pasivos', p: 'Compras automáticas y ciegas por el enorme peso de Apple en los índices.' },
              { h: 'Recompras de acciones', p: 'Apple funciona como un comprador permanente de su propia empresa.' }
            ] }
        ] }
    ]
  });

  // Asigna num secuencial e id
  slides.forEach(function (s, i) {
    s.num = i + 1;
    s.id = 'slide-' + (i + 1);
  });

  window.PRES_DATA = {
    title: 'Valuación de Apple Inc. · Flujos de Fondos Descontados',
    footerLabel: 'Valuación AAPL · Flujos de Fondos Descontados',
    slides: slides,
    multiples: MULTIPLES,
    betaReg: BETA_REG,
    business: BUSINESS
  };
})();
