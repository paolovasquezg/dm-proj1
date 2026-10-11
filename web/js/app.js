// Navegación por etapas: flechas laterales, teclado y #número en la URL
import { diapos as portada } from "./vistas/00_portada.js";
import { diapos as contexto } from "./vistas/01_contexto.js";
import { diapos as eda } from "./vistas/03_eda.js";
import { diapos as kdd } from "./vistas/04_kdd.js";
import { diapos as similitud } from "./vistas/05_similitud.js";
import { diapos as vecinos } from "./vistas/06_vecinos.js";
import { diapos as flujos } from "./vistas/07_flujos.js";
import { diapos as reglas } from "./vistas/08_reglas.js";
import { diapos as resumen } from "./vistas/09_resumen.js";
import { diapos as cierre } from "./vistas/10_cierre.js";

const DIAPOS = [...portada, ...contexto, ...eda, ...kdd, ...similitud, ...vecinos, ...flujos, ...reglas, ...resumen, ...cierre];

const $ = (id) => document.getElementById(id);
let actual = 0;

async function mostrar(i) {
  actual = Math.max(0, Math.min(DIAPOS.length - 1, i));
  const d = DIAPOS[actual];
  const el = $("diapo");
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  el.innerHTML = "";
  $("etapa").textContent = d.etapa || "";
  $("contador").textContent = `${actual + 1} / ${DIAPOS.length}`;
  $("progreso").style.width = `${(actual / (DIAPOS.length - 1)) * 100}%`;
  $("anterior").disabled = actual === 0;
  $("siguiente").disabled = actual === DIAPOS.length - 1;
  if (location.hash !== `#${actual + 1}`) history.replaceState(null, "", `#${actual + 1}`);
  try {
    await d.render(el);
  } catch (e) {
    el.innerHTML += `<p class="lectura">No se pudieron cargar los datos de esta etapa (${e.message}). Si abres el archivo directamente, sírvelo con <code>python -m http.server -d web</code>.</p>`;
    console.error(e);
  }
  el.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

$("anterior").addEventListener("click", () => mostrar(actual - 1));
$("siguiente").addEventListener("click", () => mostrar(actual + 1));
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, select, textarea")) return;
  if (e.key === "ArrowRight" || e.key === "PageDown") mostrar(actual + 1);
  if (e.key === "ArrowLeft" || e.key === "PageUp") mostrar(actual - 1);
});
window.addEventListener("hashchange", () => {
  const n = parseInt(location.hash.slice(1), 10);
  if (!Number.isNaN(n) && n - 1 !== actual) mostrar(n - 1);
});

mostrar((parseInt(location.hash.slice(1), 10) || 1) - 1);
