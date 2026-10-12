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
const TITULOS_INDICE = [
  "Portada y escala del estudio",
  "Situación de las compras públicas",
  "Dataset y preguntas P1–P3",
  "Volumen y calidad de datos",
  "Distribución de montos",
  "Patrones de baja competencia",
  "Pipeline KDD",
  "Rendimiento de Spark",
  "MinHash y LSH",
  "Sensibilidad de parámetros",
  "Resultado P2 · OEFA",
  "Índices ANN",
  "Sensibilidad de vecinos",
  "Resultado P3 · precios",
  "Estructuras de flujo",
  "DGIM · ventana móvil",
  "Bloom · reincidencia",
  "Count-Min · frecuencias",
  "Resultado P1 · flujos",
  "Reglas de asociación",
  "Explorador de reglas",
  "14 reglas seleccionadas",
  "Principales hallazgos",
  "Fuentes y referencias",
  "Cierre",
];
const NOMBRES_SECCION = new Map([
  ["1 · Situación", "1 · Contexto de contratación pública"],
  ["2 · Dataset y preguntas", "2 · Dataset y preguntas de investigación"],
  ["3 · EDA", "3 · Análisis exploratorio de datos"],
  ["4 · KDD", "4 · Metodología KDD y Spark"],
  ["5 · Similitud (P2)", "5 · Similitud y detección de fraccionamiento"],
  ["6 · Vecinos (P3)", "6 · Vecinos aproximados y precios"],
  ["7 · Minería de flujos (P1)", "7 · Minería de flujos y competencia"],
  ["8 · Reglas de asociación (P1)", "8 · Reglas de asociación"],
  ["9 · Resumen", "9 · Síntesis de resultados"],
]);

const $ = (id) => document.getElementById(id);
let actual = 0;
let renderToken = 0;

function limpiarGraficos(el) {
  if (!window.Plotly) return;
  el.querySelectorAll(".js-plotly-plot").forEach(g => Plotly.purge(g));
}

function mejorarControles(el) {
  el.querySelectorAll('input[type="range"]').forEach(input => {
    const output = input.parentElement?.querySelector(`output[for="${input.id}"]`)
      || input.nextElementSibling?.tagName === "OUTPUT" && input.nextElementSibling;
    if (!output || input.closest(".range-shell")) return;
    const shell = document.createElement("span");
    shell.className = "range-shell";
    input.before(shell);
    shell.append(input, output);
    const actualizar = () => {
      const min = Number(input.min || 0), max = Number(input.max || 100);
      const avance = max === min ? 0 : ((Number(input.value) - min) / (max - min)) * 100;
      shell.style.setProperty("--range-p", `${avance}%`);
      input.setAttribute("aria-valuetext", output.textContent || input.value);
    };
    input.addEventListener("input", actualizar);
    actualizar();
  });
}

function mejorarTipografia(el) {
  if (window.renderMathInElement) {
    renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }
  if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
}

function actualizarIndice() {
  document.querySelectorAll(".indice-item").forEach((b, i) => {
    b.setAttribute("aria-current", i === actual ? "true" : "false");
  });
}

async function mostrar(i) {
  const token = ++renderToken;
  actual = Math.max(0, Math.min(DIAPOS.length - 1, i));
  const d = DIAPOS[actual];
  const el = $("diapo");
  limpiarGraficos(el);
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  el.innerHTML = "";
  $("etapa").textContent = NOMBRES_SECCION.get(d.etapa) || d.etapa || "";
  $("contador").textContent = `Slide ${String(actual + 1).padStart(2, "0")} de ${DIAPOS.length}`;
  $("contador-nav").textContent = `${String(actual + 1).padStart(2, "0")} / ${DIAPOS.length}`;
  $("progreso").style.width = `${(actual / (DIAPOS.length - 1)) * 100}%`;
  $("anterior").disabled = actual === 0;
  $("siguiente").disabled = actual === DIAPOS.length - 1;
  actualizarIndice();
  if (location.hash !== `#${actual + 1}`) history.replaceState(null, "", `#${actual + 1}`);
  try {
    await d.render(el);
    if (token !== renderToken) return;
    mejorarControles(el);
    mejorarTipografia(el);
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  } catch (e) {
    if (token !== renderToken) return;
    el.innerHTML += `<p class="lectura">No se pudieron cargar los datos de esta etapa (${e.message}). Si abres el archivo directamente, sírvelo con <code>python -m http.server -d web</code>.</p>`;
    console.error(e);
  }
  el.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

$("anterior").addEventListener("click", () => mostrar(actual - 1));
$("siguiente").addEventListener("click", () => mostrar(actual + 1));

const indice = $("indice");
const abrirIndice = () => {
  actualizarIndice();
  indice.showModal();
  indice.querySelector('[aria-current="true"]')?.focus();
};
$("abrir-indice").addEventListener("click", abrirIndice);
$("cerrar-indice").addEventListener("click", () => indice.close());
indice.addEventListener("click", e => {
  if (e.target === indice) indice.close();
  const item = e.target.closest(".indice-item");
  if (item) {
    indice.close();
    mostrar(Number(item.dataset.indice));
  }
});
$("indice-rejilla").innerHTML = DIAPOS.map((d, i) => `
  <button class="indice-item" type="button" data-indice="${i}">
    <span class="indice-num">${String(i + 1).padStart(2, "0")}</span>
    <span class="indice-etapa">${TITULOS_INDICE[i] || d.etapa || "Vista del análisis"}</span>
  </button>`).join("");

async function alternarPantallaCompleta() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (e) {
    console.warn("El navegador no permitió cambiar a pantalla completa", e);
  }
}
$("pantalla-completa").addEventListener("click", alternarPantallaCompleta);
document.addEventListener("fullscreenchange", () => {
  $("pantalla-completa").innerHTML = `<i data-lucide="${document.fullscreenElement ? "minimize-2" : "maximize-2"}" aria-hidden="true"></i>`;
  if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
});

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, select, textarea") || e.target.isContentEditable) return;
  if (e.key === "g" || e.key === "G") { e.preventDefault(); if (!indice.open) abrirIndice(); }
  if (e.key === "f" || e.key === "F") { e.preventDefault(); alternarPantallaCompleta(); }
  if (indice.open) return;
  if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); mostrar(actual + 1); }
  if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); mostrar(actual - 1); }
  if (e.key === "Home") { e.preventDefault(); mostrar(0); }
  if (e.key === "End") { e.preventDefault(); mostrar(DIAPOS.length - 1); }
});
window.addEventListener("hashchange", () => {
  const n = parseInt(location.hash.slice(1), 10);
  if (!Number.isNaN(n) && n - 1 !== actual) mostrar(n - 1);
});

if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
else window.addEventListener("load", () => mejorarTipografia(document.body), { once: true });
mostrar((parseInt(location.hash.slice(1), 10) || 1) - 1);
