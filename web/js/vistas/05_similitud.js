import { datos, encabezado, puntos, caja, cifras, proceso, chips, graficar, barra, barraH, linea, puntosXY, pestanas, num, pct, C } from "../comun.js";

const D = "05_similitud";
const elegido = (cond) => (r) => (cond(r) ? C.azul : C.gris);

// curva S de LSH: probabilidad de ser candidato según la similitud
function curvaS(b, r) {
  const s = Array.from({ length: 101 }, (_, i) => i / 100);
  return { s, p: s.map(x => 1 - Math.pow(1 - Math.pow(x, r), b)), umbral: Math.pow(1 / b, 1 / r) };
}

export const diapos = [
  {
    etapa: "5 · Similitud (P2)",
    async render(el) {
      el.innerHTML = encabezado("Similitud Masiva con LSH",
        "Comparar cada proceso con todos los de su entidad son 3.3 millones de pares. MinHash + LSH reduce eso a los candidatos que probablemente se parecen")
        + proceso([
          ["Texto", "descripción + ítems, normalizado"],
          ["Shingles k=5", "trozos de 5 caracteres"],
          ["MinHash", "firma de <code>T</code>=100 números que resume el texto"],
          ["LSH", "<code>b</code>=10 bandas × <code>r</code>=10 filas: solo se comparan firmas que coinciden en alguna banda", true],
          ["Verificación", "misma entidad, ≤ 15 días y Jaccard exacto ≥ 0.90"],
          ["Filtros P2", "montos bajos, salto de tramo y método menos exigente"],
        ])
        + cifras([["3.3 M", "pares por fuerza bruta"], ["163 mil", "candidatos LSH (−95%)"], ["131 mil", "pares casi idénticos"], ["99.99%", "recall (pierde 9 pares)"]])
        + `<div class="fila"><div>
            <h2>Prueba la curva de LSH</h2>
            <div class="controles">
              <label>bandas <code>b</code> <input type="range" id="s-b" min="2" max="25" value="10"><output id="o-b"></output></label>
              <label>filas <code>r</code> <input type="range" id="s-r" min="2" max="20" value="10"><output id="o-r"></output></label>
            </div>
            ${puntos([
              "<b>Probabilidad:</b> <code>1 − (1 − sʳ)ᵇ</code> selecciona los candidatos LSH.",
              "<b>Umbral:</b> <code>(1/b)^(1/r)</code> debe permanecer bajo 0.90.",
              "<b>Trade-off:</b> Más bandas elevan candidatos; más filas pierden pares.",
            ])}
            <p class="lectura" id="lectura-s"></p>
          </div>${caja("g-curva", "Probabilidad de ser candidato según la similitud")}</div>`;
      const dibujar = () => {
        const b = +document.getElementById("s-b").value, r = +document.getElementById("s-r").value;
        document.getElementById("o-b").textContent = b; document.getElementById("o-r").textContent = r;
        const { s, p, umbral } = curvaS(b, r), p90 = 1 - Math.pow(1 - Math.pow(0.9, r), b);
        graficar("g-curva", [
          linea(s, p, { name: `b=${b}, r=${r}`, hovertemplate: "similitud %{x:.2f} → %{y:.1%}<extra></extra>" }),
          linea([0.9, 0.9], [0, 1], { line: { color: C.naranja, dash: "dot", width: 2 }, name: "Jaccard 0.90 (casi idéntico)", hoverinfo: "skip" }),
        ], {
          xaxis: { title: "similitud de Jaccard", range: [0, 1] },
          yaxis: { title: "P(candidato)", tickformat: ".0%", range: [0, 1.02] },
          annotations: [
            { x: umbral, y: .5, text: `umbral efectivo s* ≈ ${umbral.toFixed(2)}`, showarrow: true, arrowhead: 0, ax: -72, ay: 34, arrowcolor: C.tenue, font: { size: 10, color: C.tinta2 }, bgcolor: "rgba(255,255,255,.9)", borderpad: 4 },
            { x: .9, y: .08, text: "criterio Jaccard 0.90", showarrow: false, textangle: -90, xshift: 10, font: { size: 9, color: C.naranja } },
          ],
          shapes: [{
            type: "line", x0: umbral, x1: umbral, y0: 0, y1: 1,
            line: { color: C.azul, width: 1.5, dash: "dot" },
          }],
        });
        document.getElementById("lectura-s").innerHTML = `<b>Resultado:</b> ${b * r} hashes · umbral ${umbral.toFixed(2)} · entrada ${pct(p90 * 100, 1)}.`
          + (umbral > 0.9 ? " <b>Se perderían pares reales.</b>" : "");
      };
      ["s-b", "s-r"].forEach(id => document.getElementById(id).addEventListener("input", dibujar));
      dibujar();
    },
  },
  {
    etapa: "5 · Similitud (P2)",
    async render(el) {
      el.innerHTML = encabezado("Sensibilidad de Parámetros LSH",
        "Cada parámetro se varió manteniendo los demás fijos, evaluando contra la fuerza bruta de los 36 meses. En azul, el valor elegido")
        + `<div class="pestanas" id="tabs"></div><div class="fila">${caja("g1", "", "", "")}${caja("g2", "", "", "")}</div><p class="lectura" id="lectura"></p>`;
      const [rep, T, br, cub, umb] = await Promise.all(["a_minhash/representacion", "a_minhash/longitud_T", "b_lsh/configs_br", "b_lsh/cubetas", "b_lsh/umbral"].map(t => datos(`${D}/${t}`)));
      const titulo = (id, t) => (document.querySelector(`#${id}`).previousElementSibling.textContent = t);
      const vistas = {
        k() {
          titulo("g1", "Similitud falsa: Jaccard p99 entre pares al azar"); titulo("g2", "Casi idénticos no idénticos detectados (J ≥ 0.90)");
          const col = rep.map(elegido(r => r.representacion === "k=5"));
          graficar("g1", [barra(rep.map(r => r.representacion), rep.map(r => r.azar_p99), { marker: { color: col }, hovertemplate: "%{x}: %{y:.2f}<extra></extra>" })]);
          graficar("g2", [barra(rep.map(r => r.representacion), rep.map(r => r.ventana_no_identicos_ge_umbral), { marker: { color: col }, hovertemplate: "%{x}: %{y:,}<extra></extra>" })]);
          return "<b>k=5:</b> Equilibra falsos positivos y pérdida de casi-duplicados.";
        },
        T() {
          titulo("g1", "Error de MinHash vs Jaccard exacto"); titulo("g2", "Tiempo de firmar los 236 mil procesos (s)");
          graficar("g1", [puntosXY(T.map(r => r.T), T.map(r => r.MAE), { name: "error medido" }),
            puntosXY(T.map(r => r.T), T.map(r => r.error_teorico), { name: "teórico 1/(2√T)", line: { color: C.tenue, dash: "dot", width: 2 } })], { xaxis: { title: "T" } });
          graficar("g2", [barra(T.map(r => `T=${r.T}`), T.map(r => r.seg_firmas), { marker: { color: T.map(elegido(r => r.T === 100)) }, hovertemplate: "%{x}: %{y:.0f} s<extra></extra>" })]);
          return "<b>T=100:</b> Duplicarlo casi duplica tiempo por una mejora marginal.";
        },
        br() {
          titulo("g1", "Precisión y recall de LSH"); titulo("g2", "Candidatos a verificar (miles)");
          const x = br.map(r => `(${r.b}, ${r.r})`);
          graficar("g1", [barra(x, br.map(r => r.recall), { name: "recall", marker: { color: C.azul } }),
            barra(x, br.map(r => r.precision), { name: "precisión", marker: { color: C.aqua } })], { yaxis: { tickformat: ".0%", range: [0, 1.05] }, barmode: "group" });
          graficar("g2", [barra(x, br.map(r => r.candidatos / 1e3), { marker: { color: br.map(elegido(r => r.b === 10)) }, hovertemplate: "%{x}: %{y:,.0f} mil<extra></extra>" })]);
          return "<b>LSH 10×10:</b> Conserva el recall con 95% menos comparaciones.";
        },
        cub() {
          titulo("g1", "Candidatos (miles)"); titulo("g2", "Precisión");
          const x = cub.map(r => r.cubetas === "2^32" ? "2³²" : num(+r.cubetas));
          const col = cub.map(elegido(r => r.cubetas === "2^32"));
          graficar("g1", [barra(x, cub.map(r => r.candidatos / 1e3), { marker: { color: col } })]);
          graficar("g2", [barra(x, cub.map(r => r.precision), { marker: { color: col } })], { yaxis: { tickformat: ".0%" } });
          return "<b>2³² cubetas:</b> Evitan colisiones; 100 cubetas triplican candidatos.";
        },
        umb() {
          titulo("g1", "Pares casi idénticos según el umbral"); titulo("g2", "Recall de LSH");
          const x = umb.map(r => String(r.UMBRAL)), col = umb.map(elegido(r => r.UMBRAL === 0.9));
          graficar("g1", [barra(x, umb.map(r => r.GT), { marker: { color: col }, hovertemplate: "J ≥ %{x}: %{y:,} pares<extra></extra>" })]);
          graficar("g2", [barra(x, umb.map(r => r.recall), { marker: { color: col } })], { yaxis: { tickformat: ".1%", range: [0.97, 1.001] } });
          return "<b>Jaccard 0.90:</b> Mantiene estabilidad; 0.80 pierde 1,694 pares.";
        },
      };
      pestanas(document.getElementById("tabs"), [
        { id: "k", texto: "Shingles k" }, { id: "T", texto: "Firma T" }, { id: "br", texto: "Bandas (b, r)" },
        { id: "cub", texto: "Cubetas" }, { id: "umb", texto: "Umbral Jaccard" },
      ], id => (document.getElementById("lectura").innerHTML = vistas[id]()), "br");
    },
  },
  {
    etapa: "5 · Similitud (P2)",
    async render(el) {
      el.innerHTML = encabezado("Detección de Fraccionamiento (P2)",
        "Sobre los pares casi idénticos se aplican las condiciones del fraccionamiento, una tras otra")
        + `<div class="fila fila-fraccionamiento">
            <div class="columna-grafico">
              ${caja("g-embudo", "Procesos que pasan cada filtro", "", "alto")}
              ${puntos([
                "<b>15.7% compras repetidas:</b> 1 de cada 6 usa plantillas por compras rutinarias.",
                "<b>Fraccionamiento excepcional:</b> Solo 1,549 procesos (0.66%) cumplen el patrón completo.",
                "<b>Concentración OEFA (90%):</b> Acapara 1,388 casos; el resto suma 161.",
                "<b>Repetición legítima:</b> Institutos viales repiten hasta 67% sin fraccionar montos.",
              ])}
            </div>
            ${caja("g-rank", "Entidades con más procesos repetidos (≥ 50 procesos)", "gris: contexto · ámbar: OEFA (patrón completo)", "alto")}
          </div>`;
      const [emb, rank] = await Promise.all([datos(`${D}/d_entidades/embudo_exclusivo`), datos(`${D}/d_entidades/ranking`)]);
      const e = [...emb].reverse(), nivel = e.map(r => r.nivel.replace(/^\d\. /, ""));
      graficar("g-embudo", [barraH(nivel, e.map(r => r.procesos), {
        marker: { color: e.map((_, i) => (i === 0 ? C.naranja : C.azul)) }, text: e.map(r => `${num(r.procesos)} (${pct(r.pct_procesos, 2)})`),
        textposition: "outside", hovertemplate: "%{y}: %{x:,} procesos<extra></extra>" })], {
          margin: { l: 230 },
          xaxis: { range: [0, 68000], tickvals: [0, 20000, 40000], ticktext: ['0', '20 mil', '40 mil'] },
          annotations: [{
            xref: "paper", yref: "paper", x: 1, y: 1.05, xanchor: "right",
            text: "<b>OEFA: 1,388</b> · 90% del patrón final", showarrow: false,
            bgcolor: "rgba(255,255,255,.96)", bordercolor: "rgba(217,119,6,.28)", borderpad: 5,
            font: { size: 10, color: C.tinta },
          }],
        });
      const r = rank.slice(0, 10).reverse(), n = r.map(x => x.entidad);
      const esOefa = x => x.entidad.toUpperCase().includes("FISCALIZACION AMBIENTAL");
      const oefa = r.find(esOefa);
      graficar("g-rank", [barraH(n, r.map(x => x.rate * 100), { name: "Contexto · compras repetidas", marker: { color: "#cbd5e1" } }),
        barraH([oefa.entidad], [oefa.rate_exclusivo * 100], {
          name: "Patrón completo · OEFA", marker: { color: C.naranja },
        })],
        { barmode: "overlay", xaxis: { ticksuffix: "%" }, margin: { l: 230 }, yaxis: { tickfont: { size: 10 } } });
    },
  },
];
