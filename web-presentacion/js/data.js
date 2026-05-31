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

  // Múltiplos vs pares — output de la celda 10 del notebook
  var MULTIPLES = {
    metrics: ['P/E (TTM)', 'EV/EBITDA', 'P/S (TTM)', 'P/B'],
    companies: [
      { ticker: 'AAPL',  name: 'Apple Inc.',            mktcap: '4.583,3', pe: 37.7, evebitda: 28.8, ps: 10.2, pb: 43.0, marginOp: '32,3%', roe: '141,5%', target: true },
      { ticker: 'MSFT',  name: 'Microsoft Corporation', mktcap: '3.344,6', pe: 26.8, evebitda: 18.4, ps: 10.5, pb: 8.1,  marginOp: '46,3%', roe: '34,0%' },
      { ticker: 'GOOGL', name: 'Alphabet Inc.',         mktcap: '4.608,0', pe: 29.0, evebitda: 28.4, ps: 10.9, pb: 9.6,  marginOp: '36,1%', roe: '38,9%' },
      { ticker: 'META',  name: 'Meta Platforms, Inc.',  mktcap: '1.605,6', pe: 23.0, evebitda: 14.7, ps: 7.5,  pb: 6.6,  marginOp: '40,6%', roe: '32,9%' },
      { ticker: 'AMZN',  name: 'Amazon.com, Inc.',      mktcap: '2.911,3', pe: 31.5, evebitda: 19.3, ps: 3.9,  pb: 6.6,  marginOp: '13,1%', roe: '24,3%' }
    ],
    // promedio de pares (sin AAPL) por métrica — celda 10
    avg: { pe: 27.6, evebitda: 20.2, ps: 8.2, pb: 7.7 }
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

  // 2 — El recorrido del trabajo
  slides.push({
    layout: 'split', footer: '01',
    title: 'El recorrido del trabajo', subtitle: 'De la tasa de descuento al precio objetivo',
    left: [
      { type: 'lead', text: 'Una empresa vale la suma del dinero que generará en el futuro, traído al presente con una tasa que refleja su riesgo. Lo resolvemos en dos partes:' }
    ],
    right: [
      { type: 'columns', cols: [
        { eyebrow: 'PARTE 1 · Costo de capital', items: [
          { text: 'Apple en un vistazo + análisis por múltiplos' },
          { text: 'Costo de la deuda (Kd) y tasa impositiva efectiva' },
          { text: 'CAPM: Beta por regresión, ajuste de Blume → Ke' },
          { text: 'WACC = tasa de descuento' }
        ]},
        { eyebrow: 'PARTE 2 · Valuación intrínseca', items: [
          { text: 'FCF proyectados (cátedra) descontados al WACC' },
          { text: 'Valor terminal por Gordon-Shapiro' },
          { text: 'Enterprise Value → Equity Value → precio/acción' },
          { text: 'Sensibilidad, escenarios y veredicto' }
        ]}
      ]}
    ]
  });

  // 3 — Objetivos del proyecto
  slides.push({
    layout: 'grid', footer: '02',
    title: 'Objetivos del proyecto', subtitle: 'Qué nos propusimos demostrar',
    blocks: [
      { type: 'cards', cols: 3, items: [
        { title: 'Análisis crítico de flujos', text: 'Entender la lógica detrás de las proyecciones de analistas, no tomarlas como dogma.' },
        { title: 'Valuación por múltiplos', text: 'Usar ratios contables para comparar a Apple contra su industria.' },
        { title: 'Arquitectura de tasas', text: 'Determinar con precisión el costo de la deuda (Kd) y del accionista (Ke) vía CAPM.' },
        { title: 'Cálculo del WACC', text: 'Tasa de descuento ponderada usando valores de mercado.' },
        { title: 'Valuación intrínseca', text: 'Calcular Enterprise Value y Equity Value por acción.' },
        { title: 'Modelado de escenarios', text: 'Matrices de sensibilidad y simulaciones en Python.' }
      ]}
    ]
  });

  // 4 — Reglas del juego
  slides.push({
    layout: 'stack', footer: '03',
    title: 'Reglas del juego', subtitle: 'Qué nos dieron · qué decidimos nosotros',
    blocks: [
      { type: 'note', accent: 'blue', text: 'Clave para la defensa: el modelo es nuestro; los flujos no. Separamos con claridad cada input según su origen.' },
      { type: 'columns', cols: [
        { eyebrow: 'DATO · CÁTEDRA', tone: 'amber', items: [
          { text: 'FCF proyectados 2026-2030 (USD 153.206 M → 218.334 M)' },
          { text: 'Valor terminal de referencia (Excel cátedra: USD 3,86 T)' }
        ]},
        { eyebrow: 'MERCADO · Yahoo / Damodaran', tone: 'blue', items: [
          { text: 'Precio USD 312,06 · 14,69 B acciones' },
          { text: 'Deuda 98,7 B · caja 132,4 B → caja neta' },
          { text: 'Rating Aa1/AA+ → spread 26 bps' },
          { text: 'Rf 4,32% · ERP 4,77% (Damodaran abr-26)' }
        ]},
        { eyebrow: 'NUESTRA DECISIÓN', tone: 'green', items: [
          { text: 'g perpetuo = 3,0%' },
          { text: 'Beta ajustado por Blume (no reapalancar)' },
          { text: 'ERP implícito (forward-looking)' },
          { text: 'Kd synthetic + tax efectiva' },
          { text: 'Pesos a valor de mercado · escenarios' }
        ]}
      ]}
    ]
  });

  // 5 — Sección Bloque 01
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

  // 10 — Marco conceptual
  slides.push({
    layout: 'grid', footer: '07',
    title: 'Marco conceptual', subtitle: 'Cuatro múltiplos, cuatro preguntas',
    blocks: [
      { type: 'cards', cols: 2, items: [
        { title: 'P/E', sub: 'Precio / EPS', text: 'Cuántos años de ganancias paga el inversor.' },
        { title: 'EV/EBITDA', sub: 'Enterprise Value / EBITDA', text: 'Independiente de estructura de capital e impuestos.' },
        { title: 'P/S', sub: 'Precio / Ventas', text: 'Útil con ganancias volátiles o negativas.' },
        { title: 'P/B', sub: 'Precio / Valor libros', text: 'Cuánto se paga sobre el patrimonio contable.' }
      ]}
    ]
  });

  // 11 — Apple vs pares
  slides.push({
    layout: 'split', footer: '08',
    title: 'Apple vs pares (MSFT, GOOGL, META, AMZN)', subtitle: 'Apple cotiza con prima en casi todos los múltiplos',
    right: [ { type: 'chart', chartId: 'multiples', caption: 'Múltiplos de valuación · línea punteada = promedio de pares' } ],
    left: [
      { type: 'bullets', items: [
        { label: 'Qué muestra', text: 'En P/E, EV/EBITDA y P/B, Apple aparece a la derecha del promedio de pares: el mercado paga más por cada peso de ganancia, EBITDA o patrimonio.' },
        { label: 'Por qué importa', text: 'Una prima solo se justifica con mejor crecimiento, márgenes y foso competitivo. El FFD pone esa expectativa a prueba con números.' }
      ]}
    ]
  });

  // 12 — Lectura crítica
  slides.push({
    layout: 'stack', footer: '09',
    title: 'Lectura crítica', subtitle: '¿Se justifica la prima de Apple?',
    blocks: [
      { type: 'stats', items: [
        { value: '141,5%', label: 'ROE vs ~24-39% de los pares' },
        { value: '32,3%', label: 'Margen operativo — rentabilidad de primera línea' },
        { value: '43,0x', label: 'P/B — el mercado paga el intangible: marca y ecosistema' }
      ]},
      { type: 'note', accent: 'green', title: 'La prima tiene fundamento — pero no es gratis.', text: 'Apple combina ROE excepcional, márgenes altos y switching costs durables, lo que respalda múltiplos superiores. La pregunta del trabajo es si la prima actual ya descuenta demasiado crecimiento futuro: eso lo responde el FFD.' }
    ]
  });

  // 13 — Sección Bloque 03
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

  // 32 — Escenarios
  slides.push({
    layout: 'split', footer: '25',
    title: 'Escenarios', subtitle: 'Base, pesimista y optimista',
    right: [ { type: 'chart', chartId: 'scenarios', caption: 'Precio objetivo por escenario · línea = precio de mercado' } ],
    left: [
      { type: 'table', head: ['Escenario', 'Precio', 'Retorno', 'Parámetros'], rows: [
        ['Pesimista', 'USD 145,85', '−53,3%', 'WACC +1pp · g 2,0% · FCF −10%'],
        ['Base', 'USD 207,80', '−33,4%', 'WACC 9,24% · g 3,0% · FCF 100%'],
        ['Optimista', 'USD 326,28', '+4,6%', 'WACC −1pp · g 4,0% · FCF +10%']
      ], highlight: [1] },
      { type: 'source', text: 'Rangos definidos por nosotros' }
    ]
  });

  // 33 — Reverse-DCF
  slides.push({
    layout: 'center', footer: '26',
    title: 'Reverse-DCF', subtitle: '¿Qué crecimiento descuenta hoy el mercado?',
    blocks: [
      { type: 'stats', cols: 2, items: [
        { value: '5,40%', label: 'g implícito al precio de mercado', accent: 'red' },
        { value: '3,00%', label: 'nuestro g del caso base', accent: 'green' }
      ]},
      { type: 'note', title: 'Lectura', text: 'El mercado descuenta un crecimiento 2,4 p.p. más agresivo que el nuestro.' }
    ]
  });

  // 34 — Monte Carlo
  slides.push({
    layout: 'split', footer: '27',
    title: 'Simulación de Monte Carlo', subtitle: '10.000 valuaciones, una distribución',
    right: [ { type: 'chart', chartId: 'monteCarlo', caption: 'Distribución del precio objetivo simulado (10.000 corridas)' } ],
    left: [
      { type: 'stats', cols: 2, items: [
        { value: 'USD 207,9', label: 'Precio mediano (P50)', accent: 'green' },
        { value: '0,3%', label: 'P(valor justo > precio de mercado)', accent: 'red' }
      ]},
      { type: 'note', accent: 'blue', title: 'Intervalo 90%', text: 'USD 169,8 – 262,5. Dejamos variar WACC, g y un multiplicador del FCF dentro de rangos razonables.' }
    ]
  });

  // 35 — Tornado
  slides.push({
    layout: 'split', footer: '28',
    title: 'Tornado', subtitle: '¿Qué variable mueve más el precio?',
    right: [ { type: 'chart', chartId: 'tornado', caption: 'Rango de precio objetivo por variable (USD)' } ],
    left: [
      { type: 'bullets', ranked: true, items: [
        { label: 'WACC', text: 'La palanca dominante: la barra más larga.' },
        { label: 'g', text: 'El crecimiento perpetuo, segundo en impacto.' },
        { label: 'FCF', text: 'El nivel de flujos, tercero.' }
      ]},
      { type: 'note', title: '', text: 'WACC y g impactan directo sobre el valor terminal: por eso dominan. Es donde hay que afinar los supuestos.' }
    ]
  });

  // 36 — Football field
  slides.push({
    layout: 'split', footer: '29',
    title: 'Football field', subtitle: 'Cinco métodos, una misma dirección',
    right: [ { type: 'chart', chartId: 'footballField', caption: 'Rangos de valuación por método · líneas = mercado y DCF base' } ],
    left: [
      { type: 'bullets', items: [
        { label: 'Cómo se lee', text: 'Cada barra es un rango por método. La línea roja (mercado) cae a la derecha de casi todos: señal de sobrevaluación.' },
        { label: 'Por qué importa', text: 'No nos apoyamos en un solo método. Que DCF y múltiplos coincidan hace la conclusión más robusta.' }
      ]}
    ]
  });

  // 37 — Resumen ejecutivo
  slides.push({
    layout: 'split', footer: '30',
    title: 'Resumen ejecutivo', subtitle: 'Todo el modelo en una pantalla',
    left: [
      { type: 'subhead', text: 'Inputs principales' },
      { type: 'table', head: ['Parámetro', 'Valor'], rows: [
        ['WACC', '9,24%'],
        ['Ke', '9,36%'],
        ['Kd después de impuestos', '3,77%'],
        ['β (Blume)', '1,056'],
        ['g perpetuo', '3,0%'],
        ['FCF 2030', 'USD 218.334 M']
      ]}
    ],
    right: [
      { type: 'subhead', text: 'Valuación' },
      { type: 'table', head: ['Concepto', 'Valor', '% del Total'], rows: [
        ['VP explícito', 'USD 0,70 B', '23%'],
        ['VP valor terminal', 'USD 2,32 B', '77%'],
        ['Enterprise Value', 'USD 3,02 B', '—'],
        ['+ caja neta', 'USD 0,03 B', '—'],
        ['Equity Value', 'USD 3,05 B', '—'],
        ['Objetivo DCF (USD)', '207,80', '—'],
        ['Mercado (USD)', '312,06', '—'],
        ['Upside / (Downside)', '−33,4%', '—']
      ], highlight: [5, 7] }
    ]
  });

  // 38 — Conclusión y recomendación
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

  // 40 — Sección Anexo
  slides.push({
    layout: 'section',
    kicker: 'BLOQUE A · MATERIAL DE RESPALDO', title: 'Anexo',
    lead: 'Gráficos y chequeos adicionales para preguntas de la defensa.'
  });

  // 41 — Anexo · sensibilidad (heatmap upside%)
  slides.push({
    layout: 'split', footer: '33',
    title: 'Anexo · sensibilidad', subtitle: 'Upside / downside (%) ante WACC × g',
    right: [ { type: 'heatmap', chartId: 'upsideG', caption: 'Upside / (downside) vs. mercado (%) · verde = positivo' } ],
    left: [
      { type: 'note', accent: 'red', title: 'Casi todo en rojo', text: 'La misma grilla del precio, ahora como % vs. el mercado. El dominio del rojo refuerza el veredicto: bajo casi cualquier combinación razonable, Apple aparece cara.' }
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
