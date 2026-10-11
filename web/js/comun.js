// Utilidades compartidas: carga de datos, formato, bloques de HTML y gráficos (Plotly)

export const C = {
  azul: "#2a78d6", naranja: "#eb6834", aqua: "#1baf7a", rojo: "#d03b3b",
  gris: "#c3c2b7", tenue: "#898781", tinta: "#0b0b0b", tinta2: "#52514e", linea: "#e1e0d9",
};

const cache = new Map();
export function datos(ruta) {
  if (!cache.has(ruta)) cache.set(ruta, fetch(`data/${ruta}.json`).then(r => {
    if (!r.ok) throw new Error(`No se pudo leer data/${ruta}.json`);
    return r.json();
  }));
  return cache.get(ruta);
}

const nf = (d) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const num = (v, d = 0) => nf(d).format(v);
export const pct = (v, d = 1) => `${nf(d).format(v)}%`;

// ---- HTML ----
export const h = (strings, ...vals) => strings.reduce((a, s, i) => a + s + (i < vals.length ? vals[i] : ""), "");
export const puntos = (items) => `<ul class="puntos">${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
export const cifras = (items) => `<div class="cifras">${items.map(([v, t]) => `<div class="cifra"><b>${v}</b><span>${t}</span></div>`).join("")}</div>`;
export const proceso = (pasos) => `<div class="proceso">${pasos.map(([t, d, clave]) =>
  `<div class="paso${clave ? " clave" : ""}"><b>${t}</b><span>${d}</span></div>`).join("")}</div>`;
export const chips = (items) => `<div class="chips">${items.map(([k, v]) => `<span class="chip">${k} <b>${v}</b></span>`).join("")}</div>`;
export const caja = (id, titulo, nota = "", clase = "") =>
  `<div class="grafico"><h3>${titulo}</h3>${nota ? `<p class="nota">${nota}</p>` : ""}<div class="plot ${clase}" id="${id}"></div></div>`;
export const encabezado = (titulo, bajada) => `<h1>${titulo}</h1>${bajada ? `<p class="bajada">${bajada}</p>` : ""}`;

export function tabla(filas, columnas, { destacar } = {}) {
  const th = columnas.map(([, t]) => `<th>${t}</th>`).join("");
  const tr = filas.map(f => `<tr${destacar && destacar(f) ? ' class="destacada"' : ""}>${columnas.map(([k, , fmt]) =>
    `<td${fmt ? ' class="num"' : ""}>${fmt ? fmt(f[k], f) : f[k]}</td>`).join("")}</tr>`).join("");
  return `<table class="tabla"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

// pestañas: [{id, texto}], al elegir llama a fn(id)
export function pestanas(el, opciones, fn, inicial = opciones[0].id) {
  el.innerHTML = opciones.map(o => `<button role="tab" data-id="${o.id}">${o.texto}</button>`).join("");
  const elegir = (id) => {
    el.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.id === id));
    fn(id);
  };
  el.addEventListener("click", e => { const b = e.target.closest("button"); if (b) elegir(b.dataset.id); });
  elegir(inicial);
}

// ---- gráficos ----
const base = () => ({
  margin: { l: 56, r: 16, t: 10, b: 44 },
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 12, color: C.tinta2 },
  xaxis: { gridcolor: C.linea, linecolor: C.gris, zeroline: false, automargin: true },
  yaxis: { gridcolor: C.linea, linecolor: C.gris, zeroline: false, automargin: true },
  hoverlabel: { bgcolor: "#fff", bordercolor: C.linea, font: { color: C.tinta } },
  legend: { orientation: "h", y: 1.12, x: 0 },
  bargap: 0.25,
});
const fusion = (a, b) => {
  for (const [k, v] of Object.entries(b || {}))
    a[k] = v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" ? fusion({ ...a[k] }, v) : v;
  return a;
};

export function graficar(id, trazas, layout = {}) {
  const el = typeof id === "string" ? document.getElementById(id) : id;
  if (!el) return;
  Plotly.react(el, trazas, fusion(base(), layout), { displayModeBar: false, responsive: true });
}

// barra con valor destacado: colores = azul si destacado(i), gris si no
export const colores = (n, destacado) => Array.from({ length: n }, (_, i) => destacado(i) ? C.azul : C.gris);

export const barra = (x, y, extra = {}) => ({ type: "bar", x, y, marker: { color: C.azul }, cliponaxis: false, ...extra });
export const barraH = (y, x, extra = {}) => ({ type: "bar", orientation: "h", x, y, marker: { color: C.azul }, cliponaxis: false, ...extra });
export const linea = (x, y, extra = {}) => ({ type: "scatter", mode: "lines", x, y, line: { color: C.azul, width: 2 }, ...extra });
export const puntosXY = (x, y, extra = {}) => ({ type: "scatter", mode: "lines+markers", x, y, line: { color: C.azul, width: 2 }, marker: { size: 8 }, ...extra });
