# PROJECT-CONTEXT.md — Contexto para la IA que asista con cambios

> **Leé esto completo antes de tocar cualquier archivo.** Este documento le explica
> a una IA (vos) todo lo necesario para modificar este proyecto con seguridad.

---

## 0. Estructura del repositorio

Este repositorio contiene el trabajo y su presentación. En la raíz hay:

```
noe-seminario/
├── trabajo_completo.ipynb      ← El análisis original en Python (Jupyter notebook). Es la FUENTE de todos los números.
├── Valuacion Apple AAPL.pptx   ← El PowerPoint original que se recreó como web.
├── PROJECT-CONTEXT.md          ← Este archivo (contexto para vos, la IA).
└── web-presentacion/           ← ⭐ LA PRESENTACIÓN WEB. Es el proyecto que se edita.
```

> **El proyecto a modificar es la carpeta `web-presentacion/`.**
> Para no repetir el prefijo en todo el documento, **de la sección 4 en adelante las
> rutas son relativas a `web-presentacion/`** (es decir, `js/data.js` significa
> `web-presentacion/js/data.js`).
>
> El notebook y el pptx son material de referencia: sirven para consultar de dónde
> sale un número, pero **no hay que ejecutarlos ni editarlos** para cambiar la web.

---

## 1. Quién va a pedir los cambios y para qué

- La persona que te va a pedir cambios **no sabe programar**. Te va a describir lo
  que quiere en lenguaje común (ej: *"cambiá el título de la diapositiva del WACC"*,
  *"poné el fondo más azul"*, *"agregá una diapositiva al final"*). Tu trabajo es
  **traducir ese pedido a cambios concretos en el código** y dejarlo funcionando.
- Esto es una **presentación para un trabajo final de la facultad** (Seminario
  "¿Cuánto vale una empresa?", Facultad de Ciencias Económicas — UNLP). Es una
  **valuación de Apple Inc. (AAPL) por Flujos de Fondos Descontados (DCF)**.
- Por eso: **los números financieros importan y tienen que ser correctos.** Si un
  cambio puede afectar un número o una conclusión del análisis, **avisalo
  explícitamente** antes o después de hacerlo, en lenguaje simple.
- Cuando termines un cambio, **explicá en pocas palabras y sin tecnicismos qué
  hiciste**, para que ella entienda.

---

## 2. Qué es este proyecto

Es una **presentación de diapositivas hecha como página web** (HTML + CSS +
JavaScript, sin frameworks). Recrea un PowerPoint original (43 diapositivas) con un
diseño moderno oscuro tipo "Apple keynote", con **gráficos animados** y navegación
por teclado/botones.

- Tiene **43 diapositivas** organizadas en una portada, 6 bloques temáticos, una
  conclusión y anexos.
- Se abre **haciendo doble clic en `web-presentacion/index.html`** y **funciona sin
  internet** (offline). Esto es importante: la van a presentar en un aula.
- La navegación es solo para PC: flechas `←/→`, barra espaciadora, botones `‹ ›` en
  las esquinas, barra de progreso arriba y un contador "X / 43" abajo.

---

## 3. ⚠️ REGLAS DE ORO (no romper esto)

1. **Tiene que seguir funcionando con doble clic en `index.html` (modo `file://`),
   sin servidor.** Por eso:
   - **NO** uses `import`/`export` (módulos ES). Todos los `.js` son scripts
     clásicos que se cargan con `<script>` en `index.html`.
   - **NO** uses `fetch()` ni cargues archivos `.json` externos. Todos los datos
     están **embebidos** dentro de `js/data.js`.
   - **NO** reemplaces las librerías locales por links de CDN/internet. Chart.js
     (`vendor/chart.umd.min.js`) y la tipografía Inter (`assets/fonts/`) están
     incluidas a propósito para que funcione offline.
2. **El idioma es español (Argentina).** Los números van con **coma decimal y punto
   de miles**: `9,24%`, `207,80`, `USD 3,60 B`, `USD 218.334 M`. Mantené ese formato.
3. **No cambies los números del análisis salvo que te lo pidan explícitamente.** Si
   te piden cambiar un supuesto financiero (ver §7), seguí las instrucciones de esa
   sección al pie de la letra, porque hay números calculados y números escritos a
   mano que deben quedar coherentes.
4. **Cambios mínimos.** Tocá solo lo necesario para cumplir el pedido. No
   reescribas archivos enteros ni cambies el estilo general sin que te lo pidan.
5. **Después de cambiar, verificá** (ver §8).

---

## 4. Estructura de archivos (qué hace cada uno)

> Rutas relativas a `web-presentacion/`.

```
web-presentacion/
├── index.html              ← Página principal. Solo carga los CSS y JS. Casi nunca se toca.
├── css/
│   ├── tokens.css          ← COLORES, tipografía, tamaños base. Editá acá para cambiar el "look".
│   ├── base.css            ← Reset, fuente, fondo, barra de progreso, botones, contador.
│   ├── layouts.css         ← Estructura de cada tipo de diapositiva (portada, sección, etc.).
│   ├── components.css      ← Estilo de cada "bloque" (tarjetas, números grandes, tablas, etc.).
│   └── transitions.css     ← Animaciones de entrada de los elementos.
├── js/
│   ├── data.js             ← ⭐ EL TEXTO Y LOS NÚMEROS DE LAS 43 DIAPOSITIVAS. Lo más editado.
│   ├── finance.js          ← El modelo financiero (cálculos del DCF) + autotest de validación.
│   ├── slides.js           ← Convierte los datos de data.js en HTML. (lógica, rara vez se toca)
│   ├── charts.js           ← Los gráficos animados y los mapas de calor. (lógica)
│   ├── engine.js           ← El "motor": navegación, progreso, escalado a pantalla. (lógica)
│   └── main.js             ← Arranque. (no se toca)
├── vendor/chart.umd.min.js ← Librería de gráficos Chart.js (NO tocar).
├── assets/fonts/           ← Tipografía Inter offline (NO tocar).
└── LEEME.md                ← Instrucciones de uso para la presentadora.
```

(Este documento, `PROJECT-CONTEXT.md`, vive en la **raíz del repositorio**, un nivel
arriba de `web-presentacion/`.)

**Regla práctica:** para casi todos los pedidos de texto/contenido, el archivo es
**`js/data.js`**. Para cambios de color/estilo, **`css/tokens.css`** primero.

---

## 5. ⭐ Cómo está organizado `js/data.js` (lo más importante)

Dentro de `data.js` hay una lista de 43 diapositivas. Cada diapositiva se agrega con
`slides.push({ ... })` **en orden** (la primera del archivo es la diapositiva 1, etc.).
El número de diapositiva (`num`) y el `id` se asignan solos al final; **no hace falta
ponerlos a mano.**

Cada diapositiva tiene un campo **`layout`** que define su forma. Los layouts son:

| `layout`    | Para qué sirve | Campos que usa |
|-------------|----------------|----------------|
| `cover`     | Portada | `eyebrow`, `title`, `subtitle`, `lead`, `meta` (lista) |
| `section`   | Separador de bloque | `kicker`, `title`, `lead` |
| `closing`   | Cierre con frase y fuentes | `title`, `quote`, `sources:{title, items[], thanks}` |
| `split`     | Dos columnas (texto / gráfico) | `title`, `subtitle`, `footer`, `left:[bloques]`, `right:[bloques]` |
| `center`    | Contenido centrado (un número grande) | `title`, `subtitle`, `footer`, `blocks:[bloques]` |
| `stack`     | Bloques apilados | `title`, `subtitle`, `footer`, `blocks:[bloques]` |
| `grid`      | Grilla de tarjetas | `title`, `subtitle`, `footer`, `blocks:[bloques]` |

- `title` = título grande de la diapositiva. `subtitle` = bajada gris.
- `footer` = el numerito temático que aparece abajo a la derecha (ej. `'15'`). Es del
  PowerPoint original; no es el número real de diapositiva. Podés dejarlo o cambiarlo.
- `split` usa **`left`** y **`right`** (cada uno una lista de bloques). El resto usa
  **`blocks`** (una sola lista).

### Los "bloques" (lo que va adentro de `blocks`, `left` o `right`)

Cada bloque es un objeto con un campo `type`. Estos son todos los tipos disponibles:

```js
{ type: 'lead', text: '...' }                         // frase destacada
{ type: 'paragraph', text: '...', small: true }       // párrafo normal (small opcional)
{ type: 'subhead', text: '...' }                      // subtítulo en mayúsculas
{ type: 'tag', text: '...' }                          // etiqueta tipo "píldora"
{ type: 'source', text: 'Fuente: ...' }               // texto chico al pie

{ type: 'hero', value: 'WACC = 9,24%', label: '...', accent: 'green' }  // NÚMERO GIGANTE

{ type: 'stats', cols: 3, items: [                    // tarjetas con métricas
    { value: '141,5%', label: 'ROE...', accent: 'green' }, ... ] }

{ type: 'cards', cols: 2, items: [                    // tarjetas con texto
    { title: 'P/E', sub: 'Precio / EPS', text: '...' }, ... ] }

{ type: 'columns', dense: true, cols: [               // columnas con viñetas
    { eyebrow: 'PARTE 1', title: '...', tone: 'green',
      items: [ { label: 'Opcional', text: '...' }, { text: '...' } ] }, ... ] }

{ type: 'bullets', ranked: true, items: [             // lista (ranked = numerada 1,2,3)
    { label: 'WACC', text: '...' }, ... ] }

{ type: 'note', accent: 'blue', title: '...', text: '...' }  // recuadro/callout

{ type: 'formula', html: 'Ke = Rf + β × ERP' }        // fórmula (acepta HTML: <sub>,<sup>)

{ type: 'verdict', big: 'VENDER', text: '...' }       // veredicto grande en rojo

{ type: 'table', head: ['Col1','Col2'],               // tabla
    rows: [ ['a','b'], ['c','d'] ], highlight: [1] }  // highlight = índices de filas a resaltar (0 = primera)

{ type: 'chart', chartId: 'multiples', caption: '...' }   // gráfico (ver §6)
{ type: 'heatmap', chartId: 'waccG', caption: '...' }     // mapa de calor (ver §6)
```

**Colores de acento (`accent`)** disponibles: `'blue'`, `'green'`, `'amber'`, `'red'`.
Se usan en `hero`, `stats` (por item), y `note`. En `columns`, el campo equivalente
es `tone` (`'blue'`, `'green'`, `'amber'`).

---

## 6. Los gráficos (de dónde salen sus datos)

Los gráficos NO se dibujan en `data.js`. Se referencian por su `chartId` y se generan
en `js/charts.js`. Hay dos familias:

**Gráficos Chart.js** (`{ type: 'chart', chartId: '...' }`):
`businessMix`, `grossProfit`, `multiples`, `betaRegression`, `evComposition`,
`scenarios`, `monteCarlo`, `tornado`, `footballField`, `fcfProjected`, `fcfDiscounted`.

**Mapas de calor** (`{ type: 'heatmap', chartId: '...' }`):
`waccBetaErp`, `waccG`, `upsideG`.

**De dónde toma los datos cada gráfico:**
- La mayoría se **calculan solos** con el modelo financiero de `js/finance.js`
  (escenarios, tornado, football field, mapas de calor, composición del EV, FCF
  descontados). Si cambiás un supuesto en `finance.js` (ver §7), **estos gráficos se
  actualizan solos.**
- Algunos usan datos escritos a mano en `js/data.js`:
  - `multiples` → la tabla `MULTIPLES` (múltiplos de Apple y sus competidores).
  - `betaRegression` → el objeto `BETA_REG`.
  - `businessMix` y `grossProfit` → el objeto `BUSINESS`.
  - El histograma de `monteCarlo` se calcula, pero sus estadísticas (mediana 207,9,
    etc.) están fijas en `finance.js`.

Si te piden cambiar el **color** de un gráfico, mirá el objeto `C` al principio de
`js/charts.js`. Si te piden cambiar **datos** de un gráfico, identificá primero si son
calculados (finance.js) o escritos a mano (data.js).

---

## 7. El modelo financiero (`js/finance.js`) — manejar con cuidado

Arriba de `finance.js` están las **constantes del análisis** (flujos FCF, WACC, tasa
de crecimiento `g`, acciones, caja neta, etc.). El modelo recalcula el precio objetivo
y todos los gráficos derivados a partir de esas constantes.

⚠️ **Importante:** muchos números también aparecen **escritos a mano como texto** en
`js/data.js` (en `hero`, `stats`, `table`, `note`). Es decir: hay números *calculados*
y números *escritos*. Si te piden cambiar un supuesto (por ejemplo, "usá g = 3,5% en
vez de 3%"):

1. Cambiá la constante en `js/finance.js`.
2. **Buscá y actualizá a mano** todos los textos relacionados en `js/data.js`
   (precio objetivo, valor terminal, % del valor terminal, escenarios, conclusiones,
   resumen ejecutivo, etc.) para que coincidan.
3. Avisá claramente que esto **cambia los resultados y conclusiones del trabajo**.

Hay una función `selfTest()` en `finance.js` que, al abrir la página, escribe en la
consola del navegador (tecla F12) si los números calculados coinciden con los del
trabajo original. Si rompés algo, ahí se nota.

---

## 8. Cómo verificar que no rompiste nada

Después de cualquier cambio:

1. **Abrí `web-presentacion/index.html` con doble clic** (no hace falta servidor).
2. Recorré las diapositivas con las flechas y revisá que el cambio se vea bien y que
   nada quede cortado o vacío.
3. Abrí la consola del navegador (**F12** → pestaña "Console"):
   - Tiene que aparecer `[selfTest] TODO OK` en verde.
   - **No** tiene que haber errores en rojo.
4. Si tocaste un gráfico, entrá a esa diapositiva y confirmá que se dibuja.

---

## 9. Recetario de cambios comunes

- **"Cambiá este texto / título / número de una diapositiva"** → abrí `js/data.js`,
  buscá la diapositiva por su `title` (ej. buscar `"Resultado de la Parte 1"`) y editá
  el campo correspondiente. Mantené el formato de números (coma decimal).

- **"Agregá una diapositiva nueva"** → en `js/data.js`, agregá un nuevo
  `slides.push({ ... })` en la posición deseada (entre los `push` existentes). Elegí un
  `layout` de la tabla de §5 y completá sus campos. El número se asigna solo.

- **"Sacá una diapositiva"** → borrá su bloque `slides.push({ ... })` completo.

- **"Cambiá el orden"** → mové el bloque `slides.push({ ... })` a otra posición.

- **"Cambiá los colores / el fondo / que sea más claro"** → editá las variables en
  `css/tokens.css` (ej. `--bg-0`, `--blue`, `--green`, `--fg`). Es la forma más segura
  de cambiar el aspecto sin romper nada.

- **"La letra es muy chica/grande"** → tamaños de título y bajada en `css/layouts.css`
  (`.slide-title`, `.slide-sub`); tamaños de los bloques en `css/components.css`.

- **"Cambiá un dato de un gráfico"** → mirá §6 para saber si el dato es calculado
  (`finance.js`) o escrito a mano (`data.js`), y editá donde corresponda.

- **"Cambiá el texto del pie / quitá el numerito de abajo"** → el pie general está en
  `data.js` como `footerLabel`; el numerito por diapositiva es el campo `footer`.

---

## 10. Mini glosario (por si ayuda)

- **DCF / FFD**: Flujos de Fondos Descontados, el método de valuación del trabajo.
- **WACC**: tasa de descuento (costo de capital).
- **Ke / Kd**: costo del accionista / costo de la deuda.
- **g**: tasa de crecimiento perpetuo.
- **Valor terminal / Enterprise Value / Equity Value**: pasos del cálculo hasta llegar
  al precio objetivo por acción.
- **Conclusión del trabajo**: el precio objetivo (USD 207,80) queda por debajo del
  precio de mercado (USD 312,06) → recomendación **VENDER**. No cambies esto salvo
  pedido explícito.
