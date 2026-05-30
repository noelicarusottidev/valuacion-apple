# Valuación de Apple Inc. — Presentación web

Versión web (HTML/CSS/JavaScript) de la presentación "Valuación Apple AAPL".
Mismo contenido y mismos números que el PowerPoint original; lo que cambia es
el medio (web, diapositivas navegables) y el diseño (estética dark tipo keynote,
gráficos animados recreados con los datos exactos del trabajo).

## Cómo abrirla

1. Hacé **doble clic en `index.html`** (se abre en el navegador).
2. No necesita internet: Chart.js y la tipografía Inter están incluidas en la
   carpeta (`vendor/` y `assets/fonts/`). Funciona offline, ideal para el aula.

> Recomendado: Chrome o Edge en pantalla completa (tecla **F11**) para presentar.

## Cómo navegar (con teclado)

| Tecla | Acción |
|-------|--------|
| `→`  ·  `Barra espaciadora`  ·  `Av Pág` | Diapositiva siguiente |
| `←`  ·  `Re Pág` | Diapositiva anterior |
| `Inicio` / `Fin` | Primera / última diapositiva |

También podés usar los **botones ‹ ›** en las esquinas inferiores de la pantalla.
Arriba hay una **barra de progreso** y abajo al centro un **contador (X / 43)**.

Para saltar a una diapositiva concreta, agregá `#slide-N` al final de la URL
(por ejemplo, `index.html#slide-20`).

## Qué hay adentro

- `index.html` — página principal.
- `css/` — estilos (paleta dark, layouts, componentes, animaciones).
- `js/data.js` — todo el texto y los números de las 43 diapositivas.
- `js/finance.js` — el modelo DCF recomputado en JS (reproduce el precio
  objetivo 207,80, el WACC 9,24%, etc.). Al abrir la consola del navegador
  (F12) se ve un `selfTest` que valida que los números coinciden con el trabajo.
- `js/charts.js` — los gráficos animados (Chart.js) y los heatmaps.
- `js/slides.js`, `js/engine.js`, `js/main.js` — el armado de slides y el motor
  de navegación.
- `vendor/`, `assets/fonts/` — librerías y tipografía para funcionar offline.

Las 43 diapositivas respetan el orden y el contenido del PowerPoint original.
